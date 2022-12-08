"use strict";
/**
 * @packageDocumentation
 * @module API-EVM
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMAPI = void 0;
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const jrpcapi_1 = require("../../common/jrpcapi");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const utxos_1 = require("./utxos");
const keychain_1 = require("./keychain");
const constants_1 = require("../../utils/constants");
const tx_1 = require("./tx");
const constants_2 = require("./constants");
const inputs_1 = require("./inputs");
const outputs_1 = require("./outputs");
const exporttx_1 = require("./exporttx");
const errors_1 = require("../../utils/errors");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = utils_1.Serialization.getInstance();
/**
 * Class for interacting with a node's EVMAPI
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
class EVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly.
     * Instead use the [[Juneo.addAPI]] method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL The path to blockchain's baseURL
     * @param blockchainID The Blockchain's ID. Defaults to an empty string: ""
     */
    constructor(core, baseURL, blockchainID) {
        super(core, baseURL);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain("", "");
        this.blockchainID = "";
        this.blockchainAlias = undefined;
        this.JUNEAssetID = undefined;
        this.txFee = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            if (typeof this.blockchainAlias === "undefined") {
                const netID = this.core.getNetworkID();
                if (netID in constants_1.Defaults.network &&
                    this.blockchainID in constants_1.Defaults.network[`${netID}`]) {
                    this.blockchainAlias =
                        constants_1.Defaults.network[`${netID}`][this.blockchainID]["alias"];
                    return this.blockchainAlias;
                }
                else {
                    /* istanbul ignore next */
                    return undefined;
                }
            }
            return this.blockchainAlias;
        };
        /**
         * Sets the alias for the blockchainID.
         *
         * @param alias The alias for the blockchainID.
         *
         */
        this.setBlockchainAlias = (alias) => {
            this.blockchainAlias = alias;
            /* istanbul ignore next */
            return undefined;
        };
        /**
         * Gets the blockchainID and returns it.
         *
         * @returns The blockchainID
         */
        this.getBlockchainID = () => this.blockchainID;
        /**
         * Refresh blockchainID, and if a blockchainID is passed in, use that.
         *
         * @param Optional. BlockchainID to assign, if none, uses the default based on networkID.
         *
         * @returns A boolean if the blockchainID was successfully refreshed.
         */
        this.refreshBlockchainID = (blockchainID = undefined) => {
            if (typeof blockchainID === "string") {
                this.blockchainID = blockchainID;
                return true;
            }
            return false;
        };
        /**
         * Takes an address string and returns its {@link https://github.com/feross/buffer|Buffer} representation if valid.
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid, undefined if not valid.
         */
        this.parseAddress = (addr) => {
            const alias = this.getBlockchainAlias();
            const blockchainID = this.getBlockchainID();
            return bintools.parseAddress(addr, blockchainID, alias, constants_2.EVMConstants.ADDRESSLENGTH);
        };
        this.addressFromBuffer = (address) => {
            const chainID = this.getBlockchainAlias()
                ? this.getBlockchainAlias()
                : this.getBlockchainID();
            const type = "bech32";
            return serialization.bufferToType(address, type, this.core.getHRP(), chainID);
        };
        /**
         * Retrieves an assets name and symbol.
         *
         * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an b58 serialized string for the AssetID or its alias.
         *
         * @returns Returns a Promise Asset with keys "name", "symbol", "assetID" and "denomination".
         */
        this.getAssetDescription = (assetID) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            const params = {
                assetID: asset
            };
            const tmpBaseURL = this.getBaseURL();
            // set base url to get asset description
            this.setBaseURL("/ext/bc/X");
            const response = yield this.callMethod("jvm.getAssetDescription", params);
            // set base url back what it originally was
            this.setBaseURL(tmpBaseURL);
            return {
                name: response.data.result.name,
                symbol: response.data.result.symbol,
                assetID: bintools.cb58Decode(response.data.result.assetID),
                denomination: parseInt(response.data.result.denomination, 10)
            };
        });
        /**
         * Fetches the JUNE AssetID and returns it in a Promise.
         *
         * @param refresh This function caches the response. Refresh = true will bust the cache.
         *
         * @returns The the provided string representing the JUNE AssetID
         */
        this.getJUNEAssetID = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.JUNEAssetID === "undefined" || refresh) {
                const asset = yield this.getAssetDescription(constants_1.PrimaryAssetAlias);
                this.JUNEAssetID = asset.assetID;
            }
            return this.JUNEAssetID;
        });
        /**
         * Overrides the defaults and sets the cache to a specific JUNE AssetID
         *
         * @param juneAssetID A cb58 string or Buffer representing the JUNE AssetID
         *
         * @returns The the provided string representing the JUNE AssetID
         */
        this.setJUNEAssetID = (juneAssetID) => {
            if (typeof juneAssetID === "string") {
                juneAssetID = bintools.cb58Decode(juneAssetID);
            }
            this.JUNEAssetID = juneAssetID;
        };
        /**
         * Gets the default tx fee for this chain.
         *
         * @returns The default tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultTxFee = () => {
            return this.core.getNetworkID() in constants_1.Defaults.network
                ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["C"]["txFee"])
                : new bn_js_1.default(0);
        };
        /**
         * returns the amount of [assetID] for the given address in the state of the given block number.
         * "latest", "pending", and "accepted" meta block numbers are also allowed.
         *
         * @param hexAddress The hex representation of the address
         * @param blockHeight The block height
         * @param assetID The asset ID
         *
         * @returns Returns a Promise object containing the balance
         */
        this.getAssetBalance = (hexAddress, blockHeight, assetID) => __awaiter(this, void 0, void 0, function* () {
            const params = [hexAddress, blockHeight, assetID];
            const method = "eth_getAssetBalance";
            const path = "ext/bc/C/rpc";
            const response = yield this.callMethod(method, params, path);
            return response.data;
        });
        /**
         * Returns the status of a provided atomic transaction ID by calling the node's `getAtomicTxStatus` method.
         *
         * @param txID The string representation of the transaction ID
         *
         * @returns Returns a Promise string containing the status retrieved from the node
         */
        this.getAtomicTxStatus = (txID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID
            };
            const response = yield this.callMethod("june.getAtomicTxStatus", params);
            return response.data.result.status
                ? response.data.result.status
                : response.data.result;
        });
        /**
         * Returns the transaction data of a provided transaction ID by calling the node's `getAtomicTx` method.
         *
         * @param txID The string representation of the transaction ID
         *
         * @returns Returns a Promise string containing the bytes retrieved from the node
         */
        this.getAtomicTx = (txID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID
            };
            const response = yield this.callMethod("june.getAtomicTx", params);
            return response.data.result.tx;
        });
        /**
         * Gets the tx fee for this chain.
         *
         * @returns The tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getTxFee = () => {
            if (typeof this.txFee === "undefined") {
                this.txFee = this.getDefaultTxFee();
            }
            return this.txFee;
        };
        /**
         * Send ANT (Juneo Native Token) assets including JUNE from the EVM-Chain to an account on the X-Chain.
         *
         * After calling this method, you must call the X-Chain’s import method to complete the transfer.
         *
         * @param username The Keystore user that controls the X-Chain account specified in `to`
         * @param password The password of the Keystore user
         * @param to The account on the X-Chain to send the JUNE to.
         * @param amount Amount of asset to export as a {@link https://github.com/indutny/bn.js/|BN}
         * @param assetID The asset id which is being sent
         *
         * @returns String representing the transaction id
         */
        this.export = (username, password, to, amount, assetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                amount: amount.toString(10),
                username,
                password,
                assetID
            };
            const response = yield this.callMethod("june.export", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Send JUNE from the EVM-Chain to an account on the X-Chain.
         *
         * After calling this method, you must call the X-Chain’s importJUNE method to complete the transfer.
         *
         * @param username The Keystore user that controls the X-Chain account specified in `to`
         * @param password The password of the Keystore user
         * @param to The account on the X-Chain to send the JUNE to.
         * @param amount Amount of JUNE to export as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns String representing the transaction id
         */
        this.exportJUNE = (username, password, to, amount) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                amount: amount.toString(10),
                username,
                password
            };
            const response = yield this.callMethod("june.exportJUNE", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param sourceChain A string for the chain to look for the UTXO's. Default is to use this chain, but if exported UTXOs exist
         * from other chains, this can used to pull them instead.
         * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
         * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
         * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
         * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
         */
        this.getUTXOs = (addresses, sourceChain = undefined, limit = 0, startIndex = undefined, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            if (typeof addresses === "string") {
                addresses = [addresses];
            }
            const params = {
                addresses: addresses,
                limit,
                encoding
            };
            if (typeof startIndex !== "undefined" && startIndex) {
                params.startIndex = startIndex;
            }
            if (typeof sourceChain !== "undefined") {
                params.sourceChain = sourceChain;
            }
            const response = yield this.callMethod("june.getUTXOs", params);
            const utxos = new utxos_1.UTXOSet();
            const data = response.data.result.utxos;
            if (data.length > 0 && data[0].substring(0, 2) === "0x") {
                const cb58Strs = [];
                data.forEach((str) => {
                    cb58Strs.push(bintools.cb58Encode(new buffer_1.Buffer(str.slice(2), "hex")));
                });
                utxos.addArray(cb58Strs, false);
            }
            else {
                utxos.addArray(data, false);
            }
            response.data.result.utxos = utxos;
            return response.data.result;
        });
        /**
         * Send ANT (Juneo Native Token) assets including JUNE from an account on the X-Chain to an address on the EVM-Chain. This transaction
         * must be signed with the key of the account that the asset is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the asset is sent to.
         * @param sourceChain The chainID where the funds are coming from. Ex: "X"
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.import = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password
            };
            const response = yield this.callMethod("june.import", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Send JUNE from an account on the X-Chain to an address on the EVM-Chain. This transaction
         * must be signed with the key of the account that the JUNE is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the JUNE is sent to. This must be the same as the to
         * argument in the corresponding call to the X-Chain’s exportJUNE
         * @param sourceChain The chainID where the funds are coming from.
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.importJUNE = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password
            };
            const response = yield this.callMethod("june.importJUNE", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Give a user control over an address by providing the private key that controls the address.
         *
         * @param username The name of the user to store the private key
         * @param password The password that unlocks the user
         * @param privateKey A string representing the private key in the vm"s format
         *
         * @returns The address for the imported private key.
         */
        this.importKey = (username, password, privateKey) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                privateKey
            };
            const response = yield this.callMethod("june.importKey", params);
            return response.data.result.address
                ? response.data.result.address
                : response.data.result;
        });
        /**
         * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
         *
         * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
         *
         * @returns A Promise string representing the transaction ID of the posted transaction.
         */
        this.issueTx = (tx) => __awaiter(this, void 0, void 0, function* () {
            let Transaction = "";
            if (typeof tx === "string") {
                Transaction = tx;
            }
            else if (tx instanceof buffer_1.Buffer) {
                const txobj = new tx_1.Tx();
                txobj.fromBuffer(tx);
                Transaction = txobj.toStringHex();
            }
            else if (tx instanceof tx_1.Tx) {
                Transaction = tx.toStringHex();
            }
            else {
                /* istanbul ignore next */
                throw new errors_1.TransactionError("Error - june.issueTx: provided tx is not expected type of string, Buffer, or Tx");
            }
            const params = {
                tx: Transaction.toString(),
                encoding: "hex"
            };
            const response = yield this.callMethod("june.issueTx", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Exports the private key for an address.
         *
         * @param username The name of the user with the private key
         * @param password The password used to decrypt the private key
         * @param address The address whose private key should be exported
         *
         * @returns Promise with the decrypted private key and private key hex as store in the database
         */
        this.exportKey = (username, password, address) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                address
            };
            const response = yield this.callMethod("june.exportKey", params);
            return response.data.result;
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param toAddress The address to send the funds
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildImportTx = (utxoset, toAddress, ownerAddresses, sourceChain, fromAddresses, fee = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            const from = this._cleanAddressArray(fromAddresses, "buildImportTx").map((a) => bintools.stringToAddress(a));
            let srcChain = undefined;
            if (typeof sourceChain === "string") {
                // if there is a sourceChain passed in and it's a string then save the string value and cast the original
                // variable from a string to a Buffer
                srcChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (typeof sourceChain === "undefined" ||
                !(sourceChain instanceof buffer_1.Buffer)) {
                // if there is no sourceChain passed in or the sourceChain is any data type other than a Buffer then throw an error
                throw new errors_1.ChainIdError("Error - EVMAPI.buildImportTx: sourceChain is undefined or invalid sourceChain type.");
            }
            const utxoResponse = yield this.getUTXOs(ownerAddresses, srcChain, 0, undefined);
            const atomicUTXOs = utxoResponse.utxos;
            const networkID = this.core.getNetworkID();
            const juneAssetID = constants_1.Defaults.network[`${networkID}`].X.juneAssetID;
            const juneAssetIDBuf = bintools.cb58Decode(juneAssetID);
            const atomics = atomicUTXOs.getAllUTXOs();
            if (atomics.length === 0) {
                throw new errors_1.NoAtomicUTXOsError("Error - EVMAPI.buildImportTx: no atomic utxos to import");
            }
            const builtUnsignedTx = utxoset.buildImportTx(networkID, bintools.cb58Decode(this.blockchainID), toAddress, atomics, sourceChain, fee, juneAssetIDBuf);
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
         *
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param assetID The asset id which is being sent
         * @param destinationChain The chainid for where the assets will be sent.
         * @param toAddresses The addresses to send the funds
         * @param fromAddressHex The address being used to send the funds from the UTXOs provided
         * @param fromAddressBech The address being used to send the funds from the UTXOs provided
         * @param toAddresses The addresses to send the funds
         * @param nonce Optional. The nonce of the evm account used to send the funds
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param fee Optional. The amount being exported to destination chain to use as a fee
         * @param feeToExport Optional. The amount being exported to destination chain to use as a fee
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (amount, assetID, destinationChain, fromAddressHex, fromAddressBech, toAddresses, nonce = 0, locktime = new bn_js_1.default(0), threshold = 1, fee = new bn_js_1.default(1), feeToExport = new bn_js_1.default(1)) => __awaiter(this, void 0, void 0, function* () {
            const prefixes = {};
            toAddresses.map((address) => {
                prefixes[address.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new errors_1.AddressError("Error - EVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new errors_1.ChainIdError("Error - EVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain);
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - EVMAPI.buildExportTx: Invalid destinationChain type");
            }
            if (destinationChain.length !== 32) {
                throw new errors_1.ChainIdError("Error - EVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
            const assetDescription = yield this.getAssetDescription("JUNE");
            let evmInputs = [];
            if (bintools.cb58Encode(assetDescription.assetID) === assetID) {
                const evmInput = new inputs_1.EVMInput(fromAddressHex, amount.add(fee.add(feeToExport)), assetID, nonce);
                evmInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
                evmInputs.push(evmInput);
            }
            else {
                // if asset id isn't JUNE asset id then create 2 inputs
                // first input will be JUNE and will be for the amount of the fee
                // second input will be the ANT
                const evmJUNEInput = new inputs_1.EVMInput(fromAddressHex, fee.add(feeToExport), assetDescription.assetID, nonce);
                evmJUNEInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
                evmInputs.push(evmJUNEInput);
                const evmANTInput = new inputs_1.EVMInput(fromAddressHex, amount, assetID, nonce);
                evmANTInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
                evmInputs.push(evmANTInput);
            }
            const to = [];
            toAddresses.map((address) => {
                to.push(bintools.stringToAddress(address));
            });
            let exportedOuts = [];
            const secpTransferOutput = new outputs_1.SECPTransferOutput(amount, to, locktime, threshold);
            const transferableOutput = new outputs_1.TransferableOutput(bintools.cb58Decode(assetID), secpTransferOutput);
            exportedOuts.push(transferableOutput);
            if (!feeToExport.eq(new bn_js_1.default(0))) {
                const secpTransferOutput = new outputs_1.SECPTransferOutput(feeToExport, to, locktime, threshold);
                const transferableOutput = new outputs_1.TransferableOutput(assetDescription.assetID, secpTransferOutput);
                exportedOuts.push(transferableOutput);
            }
            // lexicographically sort ins and outs
            evmInputs = evmInputs.sort(inputs_1.EVMInput.comparator());
            exportedOuts = exportedOuts.sort(outputs_1.TransferableOutput.comparator());
            const exportTx = new exporttx_1.ExportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), destinationChain, evmInputs, exportedOuts);
            const unsignedTx = new tx_1.UnsignedTx(exportTx);
            return unsignedTx;
        });
        /**
         * Gets a reference to the keychain for this class.
         *
         * @returns The instance of [[KeyChain]] for this class
         */
        this.keyChain = () => this.keychain;
        /**
         *
         * @returns new instance of [[KeyChain]]
         */
        this.newKeyChain = () => {
            // warning, overwrites the old keychain
            const alias = this.getBlockchainAlias();
            if (alias) {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
            }
            else {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), this.blockchainID);
            }
            return this.keychain;
        };
        /**
         * @returns a Promise string containing the base fee for the next block.
         */
        this.getBaseFee = () => __awaiter(this, void 0, void 0, function* () {
            const params = [];
            const method = "eth_baseFee";
            const path = `ext/bc/${this.blockchainID}/rpc`;
            const response = yield this.callMethod(method, params, path);
            return response.data.result;
        });
        /**
         * returns the priority fee needed to be included in a block.
         *
         * @returns Returns a Promise string containing the priority fee needed to be included in a block.
         */
        this.getMaxPriorityFeePerGas = () => __awaiter(this, void 0, void 0, function* () {
            const params = [];
            const method = "eth_maxPriorityFeePerGas";
            const path = `ext/bc/${this.blockchainID}/rpc`;
            const response = yield this.callMethod(method, params, path);
            return response.data.result;
        });
        this.blockchainID = blockchainID;
        const netID = core.getNetworkID();
        if (netID in constants_1.Defaults.network &&
            blockchainID in constants_1.Defaults.network[`${netID}`]) {
            const alias = constants_1.Defaults.network[`${netID}`][`${blockchainID}`]["alias"];
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
        }
        else {
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), blockchainID);
        }
    }
    /**
     * @ignore
     */
    _cleanAddressArray(addresses, caller) {
        const addrs = [];
        const chainid = this.getBlockchainAlias()
            ? this.getBlockchainAlias()
            : this.getBlockchainID();
        if (addresses && addresses.length > 0) {
            addresses.forEach((address) => {
                if (typeof address === "string") {
                    if (typeof this.parseAddress(address) === "undefined") {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - Invalid address format");
                    }
                    addrs.push(address);
                }
                else {
                    const type = "bech32";
                    addrs.push(serialization.bufferToType(address, type, this.core.getHRP(), chainid));
                }
            });
        }
        return addrs;
    }
}
exports.EVMAPI = EVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvZXZtL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7QUFFSCxvQ0FBZ0M7QUFDaEMsa0RBQXNCO0FBRXRCLGtEQUE4QztBQUU5QyxvRUFBMkM7QUFDM0MsbUNBQXVDO0FBQ3ZDLHlDQUFxQztBQUNyQyxxREFBbUU7QUFDbkUsNkJBQXFDO0FBQ3JDLDJDQUEwQztBQU8xQyxxQ0FBbUM7QUFDbkMsdUNBQWtFO0FBQ2xFLHlDQUFxQztBQUNyQywrQ0FLMkI7QUFDM0IsdUNBQTJEO0FBYzNEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IscUJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7Ozs7O0dBTUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxpQkFBTztJQTJ5QmpDOzs7Ozs7O09BT0c7SUFDSCxZQUFZLElBQWUsRUFBRSxPQUFlLEVBQUUsWUFBb0I7UUFDaEUsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQW56QnRCOztXQUVHO1FBQ08sYUFBUSxHQUFhLElBQUksbUJBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDekMsaUJBQVksR0FBVyxFQUFFLENBQUE7UUFDekIsb0JBQWUsR0FBVyxTQUFTLENBQUE7UUFDbkMsZ0JBQVcsR0FBVyxTQUFTLENBQUE7UUFDL0IsVUFBSyxHQUFPLFNBQVMsQ0FBQTtRQUUvQjs7OztXQUlHO1FBQ0gsdUJBQWtCLEdBQUcsR0FBVyxFQUFFO1lBQ2hDLElBQUksT0FBTyxJQUFJLENBQUMsZUFBZSxLQUFLLFdBQVcsRUFBRTtnQkFDL0MsTUFBTSxLQUFLLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtnQkFDOUMsSUFDRSxL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QkFDN0MsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7b0JBQy9CLElBQUksT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQWlCLENBQUMsS0FBSyxXQUFXLEVBQUU7d0JBQy9ELDBCQUEwQjt3QkFDMUIsTUFBTSxJQUFJLHFCQUFZLENBQUMsZ0NBQWdDLENBQUMsQ0FBQTtxQkFDekQ7b0JBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFpQixDQUFDLENBQUE7aUJBQzlCO3FCQUFNO29CQUNMLE1BQU0sSUFBSSxHQUFtQixRQUFRLENBQUE7b0JBQ3JDLEtBQUssQ0FBQyxJQUFJLENBQ1IsYUFBYSxDQUFDLFlBQVksQ0FDeEIsT0FBaUIsRUFDakIsSUFBSSxFQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQ2xCLE9BQU8sQ0FDUixDQUNGLENBQUE7aUJBQ0Y7WUFDSCxDQUFDLENBQUMsQ0FBQTtTQUNIO1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0NBMERGO0FBbjJCRCx3QkFtMkJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1FVk1cclxuICovXHJcblxyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxyXG5pbXBvcnQgSnVuZW9Db3JlIGZyb20gXCIuLi8uLi9qdW5lb1wiXHJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxyXG5pbXBvcnQgeyBSZXF1ZXN0UmVzcG9uc2VEYXRhIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGliYXNlXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCB7IFVUWE9TZXQsIFVUWE8gfSBmcm9tIFwiLi91dHhvc1wiXHJcbmltcG9ydCB7IEtleUNoYWluIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxyXG5pbXBvcnQgeyBEZWZhdWx0cywgUHJpbWFyeUFzc2V0QWxpYXMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgVHgsIFVuc2lnbmVkVHggfSBmcm9tIFwiLi90eFwiXHJcbmltcG9ydCB7IEVWTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7XHJcbiAgQXNzZXQsXHJcbiAgSW5kZXgsXHJcbiAgSXNzdWVUeFBhcmFtcyxcclxuICBVVFhPUmVzcG9uc2VcclxufSBmcm9tIFwiLi8uLi8uLi9jb21tb24vaW50ZXJmYWNlc1wiXHJcbmltcG9ydCB7IEVWTUlucHV0IH0gZnJvbSBcIi4vaW5wdXRzXCJcclxuaW1wb3J0IHsgU0VDUFRyYW5zZmVyT3V0cHV0LCBUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcclxuaW1wb3J0IHsgRXhwb3J0VHggfSBmcm9tIFwiLi9leHBvcnR0eFwiXHJcbmltcG9ydCB7XHJcbiAgVHJhbnNhY3Rpb25FcnJvcixcclxuICBDaGFpbklkRXJyb3IsXHJcbiAgTm9BdG9taWNVVFhPc0Vycm9yLFxyXG4gIEFkZHJlc3NFcnJvclxyXG59IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxyXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXHJcbmltcG9ydCB7XHJcbiAgRXhwb3J0SlVORVBhcmFtcyxcclxuICBFeHBvcnRLZXlQYXJhbXMsXHJcbiAgRXhwb3J0UGFyYW1zLFxyXG4gIEdldEF0b21pY1R4UGFyYW1zLFxyXG4gIEdldEFzc2V0RGVzY3JpcHRpb25QYXJhbXMsXHJcbiAgR2V0QXRvbWljVHhTdGF0dXNQYXJhbXMsXHJcbiAgR2V0VVRYT3NQYXJhbXMsXHJcbiAgSW1wb3J0SlVORVBhcmFtcyxcclxuICBJbXBvcnRLZXlQYXJhbXMsXHJcbiAgSW1wb3J0UGFyYW1zXHJcbn0gZnJvbSBcIi4vaW50ZXJmYWNlc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIGludGVyYWN0aW5nIHdpdGggYSBub2RlJ3MgRVZNQVBJXHJcbiAqXHJcbiAqIEBjYXRlZ29yeSBSUENBUElzXHJcbiAqXHJcbiAqIEByZW1hcmtzIFRoaXMgZXh0ZW5kcyB0aGUgW1tKUlBDQVBJXV0gY2xhc3MuIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBjYWxsZWQuIEluc3RlYWQsIHVzZSB0aGUgW1tKdW5lby5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEp1bmVvLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEVWTUFQSSBleHRlbmRzIEpSUENBUEkge1xyXG4gIC8qKlxyXG4gICAqIEBpZ25vcmVcclxuICAgKi9cclxuICBwcm90ZWN0ZWQga2V5Y2hhaW46IEtleUNoYWluID0gbmV3IEtleUNoYWluKFwiXCIsIFwiXCIpXHJcbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gXCJcIlxyXG4gIHByb3RlY3RlZCBibG9ja2NoYWluQWxpYXM6IHN0cmluZyA9IHVuZGVmaW5lZFxyXG4gIHByb3RlY3RlZCBKVU5FQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkXHJcbiAgcHJvdGVjdGVkIHR4RmVlOiBCTiA9IHVuZGVmaW5lZFxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSByZXR1cm5zIGB1bmRlZmluZWRgLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklEXHJcbiAgICovXHJcbiAgZ2V0QmxvY2tjaGFpbkFsaWFzID0gKCk6IHN0cmluZyA9PiB7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMuYmxvY2tjaGFpbkFsaWFzID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIGNvbnN0IG5ldElEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcclxuICAgICAgaWYgKFxyXG4gICAgICAgIG5ldElEIGluIERlZmF1bHRzLm5ldHdvcmsgJiZcclxuICAgICAgICB0aGlzLmJsb2NrY2hhaW5JRCBpbiBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldElEfWBdXHJcbiAgICAgICkge1xyXG4gICAgICAgIHRoaXMuYmxvY2tjaGFpbkFsaWFzID1cclxuICAgICAgICAgIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0SUR9YF1bdGhpcy5ibG9ja2NoYWluSURdW1wiYWxpYXNcIl1cclxuICAgICAgICByZXR1cm4gdGhpcy5ibG9ja2NoYWluQWxpYXNcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuYmxvY2tjaGFpbkFsaWFzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhbGlhcyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSUQuXHJcbiAgICpcclxuICAgKi9cclxuICBzZXRCbG9ja2NoYWluQWxpYXMgPSAoYWxpYXM6IHN0cmluZyk6IHN0cmluZyA9PiB7XHJcbiAgICB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9IGFsaWFzXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgYmxvY2tjaGFpbklEIGFuZCByZXR1cm5zIGl0LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGJsb2NrY2hhaW5JRFxyXG4gICAqL1xyXG4gIGdldEJsb2NrY2hhaW5JRCA9ICgpOiBzdHJpbmcgPT4gdGhpcy5ibG9ja2NoYWluSURcclxuXHJcbiAgLyoqXHJcbiAgICogUmVmcmVzaCBibG9ja2NoYWluSUQsIGFuZCBpZiBhIGJsb2NrY2hhaW5JRCBpcyBwYXNzZWQgaW4sIHVzZSB0aGF0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIE9wdGlvbmFsLiBCbG9ja2NoYWluSUQgdG8gYXNzaWduLCBpZiBub25lLCB1c2VzIHRoZSBkZWZhdWx0IGJhc2VkIG9uIG5ldHdvcmtJRC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgYm9vbGVhbiBpZiB0aGUgYmxvY2tjaGFpbklEIHdhcyBzdWNjZXNzZnVsbHkgcmVmcmVzaGVkLlxyXG4gICAqL1xyXG4gIHJlZnJlc2hCbG9ja2NoYWluSUQgPSAoYmxvY2tjaGFpbklEOiBzdHJpbmcgPSB1bmRlZmluZWQpOiBib29sZWFuID0+IHtcclxuICAgIGlmICh0eXBlb2YgYmxvY2tjaGFpbklEID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHRoaXMuYmxvY2tjaGFpbklEID0gYmxvY2tjaGFpbklEXHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhbiBhZGRyZXNzIHN0cmluZyBhbmQgcmV0dXJucyBpdHMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gaWYgdmFsaWQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCwgdW5kZWZpbmVkIGlmIG5vdCB2YWxpZC5cclxuICAgKi9cclxuICBwYXJzZUFkZHJlc3MgPSAoYWRkcjogc3RyaW5nKTogQnVmZmVyID0+IHtcclxuICAgIGNvbnN0IGFsaWFzOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXHJcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcclxuICAgIHJldHVybiBiaW50b29scy5wYXJzZUFkZHJlc3MoXHJcbiAgICAgIGFkZHIsXHJcbiAgICAgIGJsb2NrY2hhaW5JRCxcclxuICAgICAgYWxpYXMsXHJcbiAgICAgIEVWTUNvbnN0YW50cy5BRERSRVNTTEVOR1RIXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBhZGRyZXNzRnJvbUJ1ZmZlciA9IChhZGRyZXNzOiBCdWZmZXIpOiBzdHJpbmcgPT4ge1xyXG4gICAgY29uc3QgY2hhaW5JRDogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxyXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcclxuICAgICAgOiB0aGlzLmdldEJsb2NrY2hhaW5JRCgpXHJcbiAgICBjb25zdCB0eXBlOiBTZXJpYWxpemVkVHlwZSA9IFwiYmVjaDMyXCJcclxuICAgIHJldHVybiBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShcclxuICAgICAgYWRkcmVzcyxcclxuICAgICAgdHlwZSxcclxuICAgICAgdGhpcy5jb3JlLmdldEhSUCgpLFxyXG4gICAgICBjaGFpbklEXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXRyaWV2ZXMgYW4gYXNzZXRzIG5hbWUgYW5kIHN5bWJvbC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhc3NldElEIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuIGI1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIEFzc2V0SUQgb3IgaXRzIGFsaWFzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2UgQXNzZXQgd2l0aCBrZXlzIFwibmFtZVwiLCBcInN5bWJvbFwiLCBcImFzc2V0SURcIiBhbmQgXCJkZW5vbWluYXRpb25cIi5cclxuICAgKi9cclxuICBnZXRBc3NldERlc2NyaXB0aW9uID0gYXN5bmMgKGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZyk6IFByb21pc2U8YW55PiA9PiB7XHJcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xyXG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYXNzZXQgPSBhc3NldElEXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGFyYW1zOiBHZXRBc3NldERlc2NyaXB0aW9uUGFyYW1zID0ge1xyXG4gICAgICBhc3NldElEOiBhc3NldFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRtcEJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpXHJcblxyXG4gICAgLy8gc2V0IGJhc2UgdXJsIHRvIGdldCBhc3NldCBkZXNjcmlwdGlvblxyXG4gICAgdGhpcy5zZXRCYXNlVVJMKFwiL2V4dC9iYy9YXCIpXHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdm0uZ2V0QXNzZXREZXNjcmlwdGlvblwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuXHJcbiAgICAvLyBzZXQgYmFzZSB1cmwgYmFjayB3aGF0IGl0IG9yaWdpbmFsbHkgd2FzXHJcbiAgICB0aGlzLnNldEJhc2VVUkwodG1wQmFzZVVSTClcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5hbWU6IHJlc3BvbnNlLmRhdGEucmVzdWx0Lm5hbWUsXHJcbiAgICAgIHN5bWJvbDogcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3ltYm9sLFxyXG4gICAgICBhc3NldElEOiBiaW50b29scy5jYjU4RGVjb2RlKHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SUQpLFxyXG4gICAgICBkZW5vbWluYXRpb246IHBhcnNlSW50KHJlc3BvbnNlLmRhdGEucmVzdWx0LmRlbm9taW5hdGlvbiwgMTApXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaGVzIHRoZSBKVU5FIEFzc2V0SUQgYW5kIHJldHVybnMgaXQgaW4gYSBQcm9taXNlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlZnJlc2ggVGhpcyBmdW5jdGlvbiBjYWNoZXMgdGhlIHJlc3BvbnNlLiBSZWZyZXNoID0gdHJ1ZSB3aWxsIGJ1c3QgdGhlIGNhY2hlLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBKVU5FIEFzc2V0SURcclxuICAgKi9cclxuICBnZXRKVU5FQXNzZXRJRCA9IGFzeW5jIChyZWZyZXNoOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPEJ1ZmZlcj4gPT4ge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLkpVTkVBc3NldElEID09PSBcInVuZGVmaW5lZFwiIHx8IHJlZnJlc2gpIHtcclxuICAgICAgY29uc3QgYXNzZXQ6IEFzc2V0ID0gYXdhaXQgdGhpcy5nZXRBc3NldERlc2NyaXB0aW9uKFByaW1hcnlBc3NldEFsaWFzKVxyXG4gICAgICB0aGlzLkpVTkVBc3NldElEID0gYXNzZXQuYXNzZXRJRFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuSlVORUFzc2V0SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE92ZXJyaWRlcyB0aGUgZGVmYXVsdHMgYW5kIHNldHMgdGhlIGNhY2hlIHRvIGEgc3BlY2lmaWMgSlVORSBBc3NldElEXHJcbiAgICpcclxuICAgKiBAcGFyYW0ganVuZUFzc2V0SUQgQSBjYjU4IHN0cmluZyBvciBCdWZmZXIgcmVwcmVzZW50aW5nIHRoZSBKVU5FIEFzc2V0SURcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgSlVORSBBc3NldElEXHJcbiAgICovXHJcbiAgc2V0SlVORUFzc2V0SUQgPSAoanVuZUFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlcikgPT4ge1xyXG4gICAgaWYgKHR5cGVvZiBqdW5lQXNzZXRJRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBqdW5lQXNzZXRJRCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoanVuZUFzc2V0SUQpXHJcbiAgICB9XHJcbiAgICB0aGlzLkpVTkVBc3NldElEID0ganVuZUFzc2V0SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgdHggZmVlIGZvciB0aGlzIGNoYWluLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGRlZmF1bHQgdHggZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKi9cclxuICBnZXREZWZhdWx0VHhGZWUgPSAoKTogQk4gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSBpbiBEZWZhdWx0cy5uZXR3b3JrXHJcbiAgICAgID8gbmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIkNcIl1bXCJ0eEZlZVwiXSlcclxuICAgICAgOiBuZXcgQk4oMClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIHJldHVybnMgdGhlIGFtb3VudCBvZiBbYXNzZXRJRF0gZm9yIHRoZSBnaXZlbiBhZGRyZXNzIGluIHRoZSBzdGF0ZSBvZiB0aGUgZ2l2ZW4gYmxvY2sgbnVtYmVyLlxyXG4gICAqIFwibGF0ZXN0XCIsIFwicGVuZGluZ1wiLCBhbmQgXCJhY2NlcHRlZFwiIG1ldGEgYmxvY2sgbnVtYmVycyBhcmUgYWxzbyBhbGxvd2VkLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGhleEFkZHJlc3MgVGhlIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWRkcmVzc1xyXG4gICAqIEBwYXJhbSBibG9ja0hlaWdodCBUaGUgYmxvY2sgaGVpZ2h0XHJcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0IElEXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBvYmplY3QgY29udGFpbmluZyB0aGUgYmFsYW5jZVxyXG4gICAqL1xyXG4gIGdldEFzc2V0QmFsYW5jZSA9IGFzeW5jIChcclxuICAgIGhleEFkZHJlc3M6IHN0cmluZyxcclxuICAgIGJsb2NrSGVpZ2h0OiBzdHJpbmcsXHJcbiAgICBhc3NldElEOiBzdHJpbmdcclxuICApOiBQcm9taXNlPG9iamVjdD4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBzdHJpbmdbXSA9IFtoZXhBZGRyZXNzLCBibG9ja0hlaWdodCwgYXNzZXRJRF1cclxuXHJcbiAgICBjb25zdCBtZXRob2Q6IHN0cmluZyA9IFwiZXRoX2dldEFzc2V0QmFsYW5jZVwiXHJcbiAgICBjb25zdCBwYXRoOiBzdHJpbmcgPSBcImV4dC9iYy9DL3JwY1wiXHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgbWV0aG9kLFxyXG4gICAgICBwYXJhbXMsXHJcbiAgICAgIHBhdGhcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzdGF0dXMgb2YgYSBwcm92aWRlZCBhdG9taWMgdHJhbnNhY3Rpb24gSUQgYnkgY2FsbGluZyB0aGUgbm9kZSdzIGBnZXRBdG9taWNUeFN0YXR1c2AgbWV0aG9kLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHR4SUQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBzdGF0dXMgcmV0cmlldmVkIGZyb20gdGhlIG5vZGVcclxuICAgKi9cclxuICBnZXRBdG9taWNUeFN0YXR1cyA9IGFzeW5jICh0eElEOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBHZXRBdG9taWNUeFN0YXR1c1BhcmFtcyA9IHtcclxuICAgICAgdHhJRFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp1bmUuZ2V0QXRvbWljVHhTdGF0dXNcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3RhdHVzXHJcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3RhdHVzXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHRyYW5zYWN0aW9uIGRhdGEgb2YgYSBwcm92aWRlZCB0cmFuc2FjdGlvbiBJRCBieSBjYWxsaW5nIHRoZSBub2RlJ3MgYGdldEF0b21pY1R4YCBtZXRob2QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdHhJRCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGJ5dGVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlXHJcbiAgICovXHJcbiAgZ2V0QXRvbWljVHggPSBhc3luYyAodHhJRDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogR2V0QXRvbWljVHhQYXJhbXMgPSB7XHJcbiAgICAgIHR4SURcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdW5lLmdldEF0b21pY1R4XCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgdHggZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKi9cclxuICBnZXRUeEZlZSA9ICgpOiBCTiA9PiB7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMudHhGZWUgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhpcy50eEZlZSA9IHRoaXMuZ2V0RGVmYXVsdFR4RmVlKClcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnR4RmVlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZW5kIEFOVCAoSnVuZW8gTmF0aXZlIFRva2VuKSBhc3NldHMgaW5jbHVkaW5nIEpVTkUgZnJvbSB0aGUgRVZNLUNoYWluIHRvIGFuIGFjY291bnQgb24gdGhlIFgtQ2hhaW4uXHJcbiAgICpcclxuICAgKiBBZnRlciBjYWxsaW5nIHRoaXMgbWV0aG9kLCB5b3UgbXVzdCBjYWxsIHRoZSBYLUNoYWlu4oCZcyBpbXBvcnQgbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0cmFuc2Zlci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBYLUNoYWluIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXHJcbiAgICogQHBhcmFtIHRvIFRoZSBhY2NvdW50IG9uIHRoZSBYLUNoYWluIHRvIHNlbmQgdGhlIEpVTkUgdG8uXHJcbiAgICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgYXNzZXQgdG8gZXhwb3J0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXQgaWQgd2hpY2ggaXMgYmVpbmcgc2VudFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gaWRcclxuICAgKi9cclxuICBleHBvcnQgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIHRvOiBzdHJpbmcsXHJcbiAgICBhbW91bnQ6IEJOLFxyXG4gICAgYXNzZXRJRDogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogRXhwb3J0UGFyYW1zID0ge1xyXG4gICAgICB0byxcclxuICAgICAgYW1vdW50OiBhbW91bnQudG9TdHJpbmcoMTApLFxyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIGFzc2V0SURcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp1bmUuZXhwb3J0XCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlbmQgSlVORSBmcm9tIHRoZSBFVk0tQ2hhaW4gdG8gYW4gYWNjb3VudCBvbiB0aGUgWC1DaGFpbi5cclxuICAgKlxyXG4gICAqIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsIHlvdSBtdXN0IGNhbGwgdGhlIFgtQ2hhaW7igJlzIGltcG9ydEpVTkUgbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0cmFuc2Zlci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBYLUNoYWluIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXHJcbiAgICogQHBhcmFtIHRvIFRoZSBhY2NvdW50IG9uIHRoZSBYLUNoYWluIHRvIHNlbmQgdGhlIEpVTkUgdG8uXHJcbiAgICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgSlVORSB0byBleHBvcnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gaWRcclxuICAgKi9cclxuICBleHBvcnRKVU5FID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXHJcbiAgICB0bzogc3RyaW5nLFxyXG4gICAgYW1vdW50OiBCTlxyXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEV4cG9ydEpVTkVQYXJhbXMgPSB7XHJcbiAgICAgIHRvLFxyXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygxMCksXHJcbiAgICAgIHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZFxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwianVuZS5leHBvcnRKVU5FXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHJpZXZlcyB0aGUgVVRYT3MgcmVsYXRlZCB0byB0aGUgYWRkcmVzc2VzIHByb3ZpZGVkIGZyb20gdGhlIG5vZGUncyBgZ2V0VVRYT3NgIG1ldGhvZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIGNiNTggc3RyaW5ncyBvciBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zXHJcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEgc3RyaW5nIGZvciB0aGUgY2hhaW4gdG8gbG9vayBmb3IgdGhlIFVUWE8ncy4gRGVmYXVsdCBpcyB0byB1c2UgdGhpcyBjaGFpbiwgYnV0IGlmIGV4cG9ydGVkIFVUWE9zIGV4aXN0XHJcbiAgICogZnJvbSBvdGhlciBjaGFpbnMsIHRoaXMgY2FuIHVzZWQgdG8gcHVsbCB0aGVtIGluc3RlYWQuXHJcbiAgICogQHBhcmFtIGxpbWl0IE9wdGlvbmFsLiBSZXR1cm5zIGF0IG1vc3QgW2xpbWl0XSBhZGRyZXNzZXMuIElmIFtsaW1pdF0gPT0gMCBvciA+IFttYXhVVFhPc1RvRmV0Y2hdLCBmZXRjaGVzIHVwIHRvIFttYXhVVFhPc1RvRmV0Y2hdLlxyXG4gICAqIEBwYXJhbSBzdGFydEluZGV4IE9wdGlvbmFsLiBbU3RhcnRJbmRleF0gZGVmaW5lcyB3aGVyZSB0byBzdGFydCBmZXRjaGluZyBVVFhPcyAoZm9yIHBhZ2luYXRpb24uKVxyXG4gICAqIFVUWE9zIGZldGNoZWQgYXJlIGZyb20gYWRkcmVzc2VzIGVxdWFsIHRvIG9yIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5BZGRyZXNzXVxyXG4gICAqIEZvciBhZGRyZXNzIFtTdGFydEluZGV4LkFkZHJlc3NdLCBvbmx5IFVUWE9zIHdpdGggSURzIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5VdHhvXSB3aWxsIGJlIHJldHVybmVkLlxyXG4gICAqL1xyXG4gIGdldFVUWE9zID0gYXN5bmMgKFxyXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSB8IHN0cmluZyxcclxuICAgIHNvdXJjZUNoYWluOiBzdHJpbmcgPSB1bmRlZmluZWQsXHJcbiAgICBsaW1pdDogbnVtYmVyID0gMCxcclxuICAgIHN0YXJ0SW5kZXg6IEluZGV4ID0gdW5kZWZpbmVkLFxyXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiaGV4XCJcclxuICApOiBQcm9taXNlPHtcclxuICAgIG51bUZldGNoZWQ6IG51bWJlclxyXG4gICAgdXR4b3NcclxuICAgIGVuZEluZGV4OiBJbmRleFxyXG4gIH0+ID0+IHtcclxuICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIGFkZHJlc3NlcyA9IFthZGRyZXNzZXNdXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGFyYW1zOiBHZXRVVFhPc1BhcmFtcyA9IHtcclxuICAgICAgYWRkcmVzc2VzOiBhZGRyZXNzZXMsXHJcbiAgICAgIGxpbWl0LFxyXG4gICAgICBlbmNvZGluZ1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiBzdGFydEluZGV4ICE9PSBcInVuZGVmaW5lZFwiICYmIHN0YXJ0SW5kZXgpIHtcclxuICAgICAgcGFyYW1zLnN0YXJ0SW5kZXggPSBzdGFydEluZGV4XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBwYXJhbXMuc291cmNlQ2hhaW4gPSBzb3VyY2VDaGFpblxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp1bmUuZ2V0VVRYT3NcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICBjb25zdCB1dHhvczogVVRYT1NldCA9IG5ldyBVVFhPU2V0KClcclxuICAgIGNvbnN0IGRhdGE6IGFueSA9IHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zXHJcbiAgICBpZiAoZGF0YS5sZW5ndGggPiAwICYmIGRhdGFbMF0uc3Vic3RyaW5nKDAsIDIpID09PSBcIjB4XCIpIHtcclxuICAgICAgY29uc3QgY2I1OFN0cnM6IHN0cmluZ1tdID0gW11cclxuICAgICAgZGF0YS5mb3JFYWNoKChzdHI6IHN0cmluZyk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNiNThTdHJzLnB1c2goYmludG9vbHMuY2I1OEVuY29kZShuZXcgQnVmZmVyKHN0ci5zbGljZSgyKSwgXCJoZXhcIikpKVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgdXR4b3MuYWRkQXJyYXkoY2I1OFN0cnMsIGZhbHNlKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdXR4b3MuYWRkQXJyYXkoZGF0YSwgZmFsc2UpXHJcbiAgICB9XHJcbiAgICByZXNwb25zZS5kYXRhLnJlc3VsdC51dHhvcyA9IHV0eG9zXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlbmQgQU5UIChKdW5lbyBOYXRpdmUgVG9rZW4pIGFzc2V0cyBpbmNsdWRpbmcgSlVORSBmcm9tIGFuIGFjY291bnQgb24gdGhlIFgtQ2hhaW4gdG8gYW4gYWRkcmVzcyBvbiB0aGUgRVZNLUNoYWluLiBUaGlzIHRyYW5zYWN0aW9uXHJcbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIGFzc2V0IGlzIHNlbnQgZnJvbSBhbmQgd2hpY2ggcGF5c1xyXG4gICAqIHRoZSB0cmFuc2FjdGlvbiBmZWUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcclxuICAgKiBAcGFyYW0gdG8gVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdGhlIGFzc2V0IGlzIHNlbnQgdG8uXHJcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbklEIHdoZXJlIHRoZSBmdW5kcyBhcmUgY29taW5nIGZyb20uIEV4OiBcIlhcIlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgZm9yIHRoZSB0cmFuc2FjdGlvbiwgd2hpY2ggc2hvdWxkIGJlIHNlbnQgdG8gdGhlIG5ldHdvcmtcclxuICAgKiBieSBjYWxsaW5nIGlzc3VlVHguXHJcbiAgICovXHJcbiAgaW1wb3J0ID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXHJcbiAgICB0bzogc3RyaW5nLFxyXG4gICAgc291cmNlQ2hhaW46IHN0cmluZ1xyXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEltcG9ydFBhcmFtcyA9IHtcclxuICAgICAgdG8sXHJcbiAgICAgIHNvdXJjZUNoYWluLFxyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmRcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp1bmUuaW1wb3J0XCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlbmQgSlVORSBmcm9tIGFuIGFjY291bnQgb24gdGhlIFgtQ2hhaW4gdG8gYW4gYWRkcmVzcyBvbiB0aGUgRVZNLUNoYWluLiBUaGlzIHRyYW5zYWN0aW9uXHJcbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIEpVTkUgaXMgc2VudCBmcm9tIGFuZCB3aGljaCBwYXlzXHJcbiAgICogdGhlIHRyYW5zYWN0aW9uIGZlZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0aGUgSlVORSBpcyBzZW50IHRvLiBUaGlzIG11c3QgYmUgdGhlIHNhbWUgYXMgdGhlIHRvXHJcbiAgICogYXJndW1lbnQgaW4gdGhlIGNvcnJlc3BvbmRpbmcgY2FsbCB0byB0aGUgWC1DaGFpbuKAmXMgZXhwb3J0SlVORVxyXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBUaGUgY2hhaW5JRCB3aGVyZSB0aGUgZnVuZHMgYXJlIGNvbWluZyBmcm9tLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgZm9yIHRoZSB0cmFuc2FjdGlvbiwgd2hpY2ggc2hvdWxkIGJlIHNlbnQgdG8gdGhlIG5ldHdvcmtcclxuICAgKiBieSBjYWxsaW5nIGlzc3VlVHguXHJcbiAgICovXHJcbiAgaW1wb3J0SlVORSA9IGFzeW5jIChcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXHJcbiAgICBwYXNzd29yZDogc3RyaW5nLFxyXG4gICAgdG86IHN0cmluZyxcclxuICAgIHNvdXJjZUNoYWluOiBzdHJpbmdcclxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBJbXBvcnRKVU5FUGFyYW1zID0ge1xyXG4gICAgICB0byxcclxuICAgICAgc291cmNlQ2hhaW4sXHJcbiAgICAgIHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZFxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwianVuZS5pbXBvcnRKVU5FXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmUgYSB1c2VyIGNvbnRyb2wgb3ZlciBhbiBhZGRyZXNzIGJ5IHByb3ZpZGluZyB0aGUgcHJpdmF0ZSBrZXkgdGhhdCBjb250cm9scyB0aGUgYWRkcmVzcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB0byBzdG9yZSB0aGUgcHJpdmF0ZSBrZXlcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHRoYXQgdW5sb2NrcyB0aGUgdXNlclxyXG4gICAqIEBwYXJhbSBwcml2YXRlS2V5IEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcHJpdmF0ZSBrZXkgaW4gdGhlIHZtXCJzIGZvcm1hdFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGFkZHJlc3MgZm9yIHRoZSBpbXBvcnRlZCBwcml2YXRlIGtleS5cclxuICAgKi9cclxuICBpbXBvcnRLZXkgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIHByaXZhdGVLZXk6IHN0cmluZ1xyXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEltcG9ydEtleVBhcmFtcyA9IHtcclxuICAgICAgdXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkLFxyXG4gICAgICBwcml2YXRlS2V5XHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdW5lLmltcG9ydEtleVwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXHJcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xyXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxscyB0aGUgbm9kZSdzIGlzc3VlVHggbWV0aG9kIGZyb20gdGhlIEFQSSBhbmQgcmV0dXJucyB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIElEIGFzIGEgc3RyaW5nLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHR4IEEgc3RyaW5nLCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSwgb3IgW1tUeF1dIHJlcHJlc2VudGluZyBhIHRyYW5zYWN0aW9uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIFByb21pc2Ugc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gSUQgb2YgdGhlIHBvc3RlZCB0cmFuc2FjdGlvbi5cclxuICAgKi9cclxuICBpc3N1ZVR4ID0gYXN5bmMgKHR4OiBzdHJpbmcgfCBCdWZmZXIgfCBUeCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBsZXQgVHJhbnNhY3Rpb246IHN0cmluZyA9IFwiXCJcclxuICAgIGlmICh0eXBlb2YgdHggPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgVHJhbnNhY3Rpb24gPSB0eFxyXG4gICAgfSBlbHNlIGlmICh0eCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xyXG4gICAgICBjb25zdCB0eG9iajogVHggPSBuZXcgVHgoKVxyXG4gICAgICB0eG9iai5mcm9tQnVmZmVyKHR4KVxyXG4gICAgICBUcmFuc2FjdGlvbiA9IHR4b2JqLnRvU3RyaW5nSGV4KClcclxuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBUeCkge1xyXG4gICAgICBUcmFuc2FjdGlvbiA9IHR4LnRvU3RyaW5nSGV4KClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBUcmFuc2FjdGlvbkVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBqdW5lLmlzc3VlVHg6IHByb3ZpZGVkIHR4IGlzIG5vdCBleHBlY3RlZCB0eXBlIG9mIHN0cmluZywgQnVmZmVyLCBvciBUeFwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIGNvbnN0IHBhcmFtczogSXNzdWVUeFBhcmFtcyA9IHtcclxuICAgICAgdHg6IFRyYW5zYWN0aW9uLnRvU3RyaW5nKCksXHJcbiAgICAgIGVuY29kaW5nOiBcImhleFwiXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdW5lLmlzc3VlVHhcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxyXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXhwb3J0cyB0aGUgcHJpdmF0ZSBrZXkgZm9yIGFuIGFkZHJlc3MuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgd2l0aCB0aGUgcHJpdmF0ZSBrZXlcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHVzZWQgdG8gZGVjcnlwdCB0aGUgcHJpdmF0ZSBrZXlcclxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB3aG9zZSBwcml2YXRlIGtleSBzaG91bGQgYmUgZXhwb3J0ZWRcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2Ugd2l0aCB0aGUgZGVjcnlwdGVkIHByaXZhdGUga2V5IGFuZCBwcml2YXRlIGtleSBoZXggYXMgc3RvcmUgaW4gdGhlIGRhdGFiYXNlXHJcbiAgICovXHJcbiAgZXhwb3J0S2V5ID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXHJcbiAgICBhZGRyZXNzOiBzdHJpbmdcclxuICApOiBQcm9taXNlPG9iamVjdD4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBFeHBvcnRLZXlQYXJhbXMgPSB7XHJcbiAgICAgIHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZCxcclxuICAgICAgYWRkcmVzc1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwianVuZS5leHBvcnRLZXlcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cclxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXHJcbiAgICogQHBhcmFtIHRvQWRkcmVzcyBUaGUgYWRkcmVzcyB0byBzZW5kIHRoZSBmdW5kc1xyXG4gICAqIEBwYXJhbSBvd25lckFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gaW1wb3J0XHJcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbmlkIGZvciB3aGVyZSB0aGUgaW1wb3J0IGlzIGNvbWluZyBmcm9tXHJcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tJbXBvcnRUeF1dLlxyXG4gICAqXHJcbiAgICogQHJlbWFya3NcclxuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxyXG4gICAqL1xyXG4gIGJ1aWxkSW1wb3J0VHggPSBhc3luYyAoXHJcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxyXG4gICAgdG9BZGRyZXNzOiBzdHJpbmcsXHJcbiAgICBvd25lckFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBzb3VyY2VDaGFpbjogQnVmZmVyIHwgc3RyaW5nLFxyXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBmZWU6IEJOID0gbmV3IEJOKDApXHJcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XHJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBmcm9tQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkSW1wb3J0VHhcIlxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcbiAgICBsZXQgc3JjQ2hhaW46IHN0cmluZyA9IHVuZGVmaW5lZFxyXG5cclxuICAgIGlmICh0eXBlb2Ygc291cmNlQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VyY2VDaGFpbiBwYXNzZWQgaW4gYW5kIGl0J3MgYSBzdHJpbmcgdGhlbiBzYXZlIHRoZSBzdHJpbmcgdmFsdWUgYW5kIGNhc3QgdGhlIG9yaWdpbmFsXHJcbiAgICAgIC8vIHZhcmlhYmxlIGZyb20gYSBzdHJpbmcgdG8gYSBCdWZmZXJcclxuICAgICAgc3JjQ2hhaW4gPSBzb3VyY2VDaGFpblxyXG4gICAgICBzb3VyY2VDaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoc291cmNlQ2hhaW4pXHJcbiAgICB9IGVsc2UgaWYgKFxyXG4gICAgICB0eXBlb2Ygc291cmNlQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIgfHxcclxuICAgICAgIShzb3VyY2VDaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcilcclxuICAgICkge1xyXG4gICAgICAvLyBpZiB0aGVyZSBpcyBubyBzb3VyY2VDaGFpbiBwYXNzZWQgaW4gb3IgdGhlIHNvdXJjZUNoYWluIGlzIGFueSBkYXRhIHR5cGUgb3RoZXIgdGhhbiBhIEJ1ZmZlciB0aGVuIHRocm93IGFuIGVycm9yXHJcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEVWTUFQSS5idWlsZEltcG9ydFR4OiBzb3VyY2VDaGFpbiBpcyB1bmRlZmluZWQgb3IgaW52YWxpZCBzb3VyY2VDaGFpbiB0eXBlLlwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIGNvbnN0IHV0eG9SZXNwb25zZTogVVRYT1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXRVVFhPcyhcclxuICAgICAgb3duZXJBZGRyZXNzZXMsXHJcbiAgICAgIHNyY0NoYWluLFxyXG4gICAgICAwLFxyXG4gICAgICB1bmRlZmluZWRcclxuICAgIClcclxuICAgIGNvbnN0IGF0b21pY1VUWE9zOiBVVFhPU2V0ID0gdXR4b1Jlc3BvbnNlLnV0eG9zXHJcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxyXG4gICAgY29uc3QganVuZUFzc2V0SUQ6IHN0cmluZyA9IERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0d29ya0lEfWBdLlguanVuZUFzc2V0SURcclxuICAgIGNvbnN0IGp1bmVBc3NldElEQnVmOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKGp1bmVBc3NldElEKVxyXG4gICAgY29uc3QgYXRvbWljczogVVRYT1tdID0gYXRvbWljVVRYT3MuZ2V0QWxsVVRYT3MoKVxyXG5cclxuICAgIGlmIChhdG9taWNzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICB0aHJvdyBuZXcgTm9BdG9taWNVVFhPc0Vycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBFVk1BUEkuYnVpbGRJbXBvcnRUeDogbm8gYXRvbWljIHV0eG9zIHRvIGltcG9ydFwiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkSW1wb3J0VHgoXHJcbiAgICAgIG5ldHdvcmtJRCxcclxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXHJcbiAgICAgIHRvQWRkcmVzcyxcclxuICAgICAgYXRvbWljcyxcclxuICAgICAgc291cmNlQ2hhaW4sXHJcbiAgICAgIGZlZSxcclxuICAgICAganVuZUFzc2V0SURCdWZcclxuICAgIClcclxuXHJcbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBFeHBvcnQgVHguIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXHJcbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcykuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldCBpZCB3aGljaCBpcyBiZWluZyBzZW50XHJcbiAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gVGhlIGNoYWluaWQgZm9yIHdoZXJlIHRoZSBhc3NldHMgd2lsbCBiZSBzZW50LlxyXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXHJcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzSGV4IFRoZSBhZGRyZXNzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3MgcHJvdmlkZWRcclxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NCZWNoIFRoZSBhZGRyZXNzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3MgcHJvdmlkZWRcclxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xyXG4gICAqIEBwYXJhbSBub25jZSBPcHRpb25hbC4gVGhlIG5vbmNlIG9mIHRoZSBldm0gYWNjb3VudCB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzXHJcbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcclxuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xyXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgdG8gZGVzdGluYXRpb24gY2hhaW4gdG8gdXNlIGFzIGEgZmVlXHJcbiAgICogQHBhcmFtIGZlZVRvRXhwb3J0IE9wdGlvbmFsLiBUaGUgYW1vdW50IGJlaW5nIGV4cG9ydGVkIHRvIGRlc3RpbmF0aW9uIGNoYWluIHRvIHVzZSBhcyBhIGZlZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhbiBbW0V4cG9ydFR4XV0uXHJcbiAgICovXHJcbiAgYnVpbGRFeHBvcnRUeCA9IGFzeW5jIChcclxuICAgIGFtb3VudDogQk4sXHJcbiAgICBhc3NldElEOiBCdWZmZXIgfCBzdHJpbmcsXHJcbiAgICBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgfCBzdHJpbmcsXHJcbiAgICBmcm9tQWRkcmVzc0hleDogc3RyaW5nLFxyXG4gICAgZnJvbUFkZHJlc3NCZWNoOiBzdHJpbmcsXHJcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBub25jZTogbnVtYmVyID0gMCxcclxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcclxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMSxcclxuICAgIGZlZTogQk4gPSBuZXcgQk4oMSksXHJcbiAgICBmZWVUb0V4cG9ydDogQk4gPSBuZXcgQk4oMSlcclxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcclxuICAgIGNvbnN0IHByZWZpeGVzOiBvYmplY3QgPSB7fVxyXG4gICAgdG9BZGRyZXNzZXMubWFwKChhZGRyZXNzOiBzdHJpbmcpID0+IHtcclxuICAgICAgcHJlZml4ZXNbYWRkcmVzcy5zcGxpdChcIi1cIilbMF1dID0gdHJ1ZVxyXG4gICAgfSlcclxuICAgIGlmIChPYmplY3Qua2V5cyhwcmVmaXhlcykubGVuZ3RoICE9PSAxKSB7XHJcbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEVWTUFQSS5idWlsZEV4cG9ydFR4OiBUbyBhZGRyZXNzZXMgbXVzdCBoYXZlIHRoZSBzYW1lIGNoYWluSUQgcHJlZml4LlwiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gRVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgaXMgdW5kZWZpbmVkLlwiXHJcbiAgICAgIClcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoZGVzdGluYXRpb25DaGFpbilcclxuICAgIH0gZWxzZSBpZiAoIShkZXN0aW5hdGlvbkNoYWluIGluc3RhbmNlb2YgQnVmZmVyKSkge1xyXG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBFVk1BUEkuYnVpbGRFeHBvcnRUeDogSW52YWxpZCBkZXN0aW5hdGlvbkNoYWluIHR5cGVcIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICBpZiAoZGVzdGluYXRpb25DaGFpbi5sZW5ndGggIT09IDMyKSB7XHJcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEVWTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIG11c3QgYmUgMzIgYnl0ZXMgaW4gbGVuZ3RoLlwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIGNvbnN0IGFzc2V0RGVzY3JpcHRpb246IGFueSA9IGF3YWl0IHRoaXMuZ2V0QXNzZXREZXNjcmlwdGlvbihcIkpVTkVcIilcclxuICAgIGxldCBldm1JbnB1dHM6IEVWTUlucHV0W10gPSBbXVxyXG4gICAgaWYgKGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXREZXNjcmlwdGlvbi5hc3NldElEKSA9PT0gYXNzZXRJRCkge1xyXG4gICAgICBjb25zdCBldm1JbnB1dDogRVZNSW5wdXQgPSBuZXcgRVZNSW5wdXQoXHJcbiAgICAgICAgZnJvbUFkZHJlc3NIZXgsXHJcbiAgICAgICAgYW1vdW50LmFkZChmZWUuYWRkKGZlZVRvRXhwb3J0KSksXHJcbiAgICAgICAgYXNzZXRJRCxcclxuICAgICAgICBub25jZVxyXG4gICAgICApXHJcbiAgICAgIGV2bUlucHV0LmFkZFNpZ25hdHVyZUlkeCgwLCBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoZnJvbUFkZHJlc3NCZWNoKSlcclxuICAgICAgZXZtSW5wdXRzLnB1c2goZXZtSW5wdXQpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBpZiBhc3NldCBpZCBpc24ndCBKVU5FIGFzc2V0IGlkIHRoZW4gY3JlYXRlIDIgaW5wdXRzXHJcbiAgICAgIC8vIGZpcnN0IGlucHV0IHdpbGwgYmUgSlVORSBhbmQgd2lsbCBiZSBmb3IgdGhlIGFtb3VudCBvZiB0aGUgZmVlXHJcbiAgICAgIC8vIHNlY29uZCBpbnB1dCB3aWxsIGJlIHRoZSBBTlRcclxuICAgICAgY29uc3QgZXZtSlVORUlucHV0OiBFVk1JbnB1dCA9IG5ldyBFVk1JbnB1dChcclxuICAgICAgICBmcm9tQWRkcmVzc0hleCxcclxuICAgICAgICBmZWUuYWRkKGZlZVRvRXhwb3J0KSxcclxuICAgICAgICBhc3NldERlc2NyaXB0aW9uLmFzc2V0SUQsXHJcbiAgICAgICAgbm9uY2VcclxuICAgICAgKVxyXG4gICAgICBldm1KVU5FSW5wdXQuYWRkU2lnbmF0dXJlSWR4KDAsIGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhmcm9tQWRkcmVzc0JlY2gpKVxyXG4gICAgICBldm1JbnB1dHMucHVzaChldm1KVU5FSW5wdXQpXHJcblxyXG4gICAgICBjb25zdCBldm1BTlRJbnB1dDogRVZNSW5wdXQgPSBuZXcgRVZNSW5wdXQoXHJcbiAgICAgICAgZnJvbUFkZHJlc3NIZXgsXHJcbiAgICAgICAgYW1vdW50LFxyXG4gICAgICAgIGFzc2V0SUQsXHJcbiAgICAgICAgbm9uY2VcclxuICAgICAgKVxyXG4gICAgICBldm1BTlRJbnB1dC5hZGRTaWduYXR1cmVJZHgoMCwgYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGZyb21BZGRyZXNzQmVjaCkpXHJcbiAgICAgIGV2bUlucHV0cy5wdXNoKGV2bUFOVElucHV0KVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IFtdXHJcbiAgICB0b0FkZHJlc3Nlcy5tYXAoKGFkZHJlc3M6IHN0cmluZyk6IHZvaWQgPT4ge1xyXG4gICAgICB0by5wdXNoKGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhZGRyZXNzKSlcclxuICAgIH0pXHJcblxyXG4gICAgbGV0IGV4cG9ydGVkT3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxyXG4gICAgY29uc3Qgc2VjcFRyYW5zZmVyT3V0cHV0OiBTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KFxyXG4gICAgICBhbW91bnQsXHJcbiAgICAgIHRvLFxyXG4gICAgICBsb2NrdGltZSxcclxuICAgICAgdGhyZXNob2xkXHJcbiAgICApXHJcbiAgICBjb25zdCB0cmFuc2ZlcmFibGVPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoXHJcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUoYXNzZXRJRCksXHJcbiAgICAgIHNlY3BUcmFuc2Zlck91dHB1dFxyXG4gICAgKVxyXG4gICAgZXhwb3J0ZWRPdXRzLnB1c2godHJhbnNmZXJhYmxlT3V0cHV0KVxyXG4gICAgaWYgKCFmZWVUb0V4cG9ydC5lcShuZXcgQk4oMCkpKSB7XHJcbiAgICAgIGNvbnN0IHNlY3BUcmFuc2Zlck91dHB1dDogU0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChcclxuICAgICAgICBmZWVUb0V4cG9ydCxcclxuICAgICAgICB0byxcclxuICAgICAgICBsb2NrdGltZSxcclxuICAgICAgICB0aHJlc2hvbGRcclxuICAgICAgKVxyXG4gICAgICBjb25zdCB0cmFuc2ZlcmFibGVPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoXHJcbiAgICAgICAgYXNzZXREZXNjcmlwdGlvbi5hc3NldElELFxyXG4gICAgICAgIHNlY3BUcmFuc2Zlck91dHB1dFxyXG4gICAgICApXHJcbiAgICAgIGV4cG9ydGVkT3V0cy5wdXNoKHRyYW5zZmVyYWJsZU91dHB1dClcclxuICAgIH1cclxuXHJcbiAgICAvLyBsZXhpY29ncmFwaGljYWxseSBzb3J0IGlucyBhbmQgb3V0c1xyXG4gICAgZXZtSW5wdXRzID0gZXZtSW5wdXRzLnNvcnQoRVZNSW5wdXQuY29tcGFyYXRvcigpKVxyXG4gICAgZXhwb3J0ZWRPdXRzID0gZXhwb3J0ZWRPdXRzLnNvcnQoVHJhbnNmZXJhYmxlT3V0cHV0LmNvbXBhcmF0b3IoKSlcclxuXHJcbiAgICBjb25zdCBleHBvcnRUeDogRXhwb3J0VHggPSBuZXcgRXhwb3J0VHgoXHJcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcclxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXHJcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4sXHJcbiAgICAgIGV2bUlucHV0cyxcclxuICAgICAgZXhwb3J0ZWRPdXRzXHJcbiAgICApXHJcblxyXG4gICAgY29uc3QgdW5zaWduZWRUeDogVW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KGV4cG9ydFR4KVxyXG4gICAgcmV0dXJuIHVuc2lnbmVkVHhcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgYSByZWZlcmVuY2UgdG8gdGhlIGtleWNoYWluIGZvciB0aGlzIGNsYXNzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGluc3RhbmNlIG9mIFtbS2V5Q2hhaW5dXSBmb3IgdGhpcyBjbGFzc1xyXG4gICAqL1xyXG4gIGtleUNoYWluID0gKCk6IEtleUNoYWluID0+IHRoaXMua2V5Y2hhaW5cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBuZXcgaW5zdGFuY2Ugb2YgW1tLZXlDaGFpbl1dXHJcbiAgICovXHJcbiAgbmV3S2V5Q2hhaW4gPSAoKTogS2V5Q2hhaW4gPT4ge1xyXG4gICAgLy8gd2FybmluZywgb3ZlcndyaXRlcyB0aGUgb2xkIGtleWNoYWluXHJcbiAgICBjb25zdCBhbGlhcyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcclxuICAgIGlmIChhbGlhcykge1xyXG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgYWxpYXMpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgdGhpcy5ibG9ja2NoYWluSUQpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5rZXljaGFpblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQGlnbm9yZVxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBfY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICBhZGRyZXNzZXM6IHN0cmluZ1tdIHwgQnVmZmVyW10sXHJcbiAgICBjYWxsZXI6IHN0cmluZ1xyXG4gICk6IHN0cmluZ1tdIHtcclxuICAgIGNvbnN0IGFkZHJzOiBzdHJpbmdbXSA9IFtdXHJcbiAgICBjb25zdCBjaGFpbmlkOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXHJcbiAgICAgID8gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxyXG4gICAgICA6IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcclxuICAgIGlmIChhZGRyZXNzZXMgJiYgYWRkcmVzc2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgYWRkcmVzc2VzLmZvckVhY2goKGFkZHJlc3M6IHN0cmluZyB8IEJ1ZmZlcikgPT4ge1xyXG4gICAgICAgIGlmICh0eXBlb2YgYWRkcmVzcyA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzIGFzIHN0cmluZykgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcIkVycm9yIC0gSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYWRkcnMucHVzaChhZGRyZXNzIGFzIHN0cmluZylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgdHlwZTogU2VyaWFsaXplZFR5cGUgPSBcImJlY2gzMlwiXHJcbiAgICAgICAgICBhZGRycy5wdXNoKFxyXG4gICAgICAgICAgICBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShcclxuICAgICAgICAgICAgICBhZGRyZXNzIGFzIEJ1ZmZlcixcclxuICAgICAgICAgICAgICB0eXBlLFxyXG4gICAgICAgICAgICAgIHRoaXMuY29yZS5nZXRIUlAoKSxcclxuICAgICAgICAgICAgICBjaGFpbmlkXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWRkcnNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkuXHJcbiAgICogSW5zdGVhZCB1c2UgdGhlIFtbSnVuZW8uYWRkQVBJXV0gbWV0aG9kLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEp1bmVvIGNsYXNzXHJcbiAgICogQHBhcmFtIGJhc2VVUkwgVGhlIHBhdGggdG8gYmxvY2tjaGFpbidzIGJhc2VVUkxcclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSBCbG9ja2NoYWluJ3MgSUQuIERlZmF1bHRzIHRvIGFuIGVtcHR5IHN0cmluZzogXCJcIlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGNvcmU6IEp1bmVvQ29yZSwgYmFzZVVSTDogc3RyaW5nLCBibG9ja2NoYWluSUQ6IHN0cmluZykge1xyXG4gICAgc3VwZXIoY29yZSwgYmFzZVVSTClcclxuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gYmxvY2tjaGFpbklEXHJcbiAgICBjb25zdCBuZXRJRDogbnVtYmVyID0gY29yZS5nZXROZXR3b3JrSUQoKVxyXG4gICAgaWYgKFxyXG4gICAgICBuZXRJRCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmXHJcbiAgICAgIGJsb2NrY2hhaW5JRCBpbiBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldElEfWBdXHJcbiAgICApIHtcclxuICAgICAgY29uc3QgYWxpYXM6IHN0cmluZyA9XHJcbiAgICAgICAgRGVmYXVsdHMubmV0d29ya1tgJHtuZXRJRH1gXVtgJHtibG9ja2NoYWluSUR9YF1bXCJhbGlhc1wiXVxyXG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgYWxpYXMpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgYmxvY2tjaGFpbklEKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBiYXNlIGZlZSBmb3IgdGhlIG5leHQgYmxvY2suXHJcbiAgICovXHJcbiAgZ2V0QmFzZUZlZSA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBzdHJpbmdbXSA9IFtdXHJcbiAgICBjb25zdCBtZXRob2Q6IHN0cmluZyA9IFwiZXRoX2Jhc2VGZWVcIlxyXG4gICAgY29uc3QgcGF0aDogc3RyaW5nID0gYGV4dC9iYy8ke3RoaXMuYmxvY2tjaGFpbklEfS9ycGNgXHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgbWV0aG9kLFxyXG4gICAgICBwYXJhbXMsXHJcbiAgICAgIHBhdGhcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogcmV0dXJucyB0aGUgcHJpb3JpdHkgZmVlIG5lZWRlZCB0byBiZSBpbmNsdWRlZCBpbiBhIGJsb2NrLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHByaW9yaXR5IGZlZSBuZWVkZWQgdG8gYmUgaW5jbHVkZWQgaW4gYSBibG9jay5cclxuICAgKi9cclxuICBnZXRNYXhQcmlvcml0eUZlZVBlckdhcyA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBzdHJpbmdbXSA9IFtdXHJcblxyXG4gICAgY29uc3QgbWV0aG9kOiBzdHJpbmcgPSBcImV0aF9tYXhQcmlvcml0eUZlZVBlckdhc1wiXHJcbiAgICBjb25zdCBwYXRoOiBzdHJpbmcgPSBgZXh0L2JjLyR7dGhpcy5ibG9ja2NoYWluSUR9L3JwY2BcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBtZXRob2QsXHJcbiAgICAgIHBhcmFtcyxcclxuICAgICAgcGF0aFxyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG59XHJcbiJdfQ==