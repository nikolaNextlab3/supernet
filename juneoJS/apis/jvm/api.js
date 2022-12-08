"use strict";
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
exports.JVMAPI = void 0;
/**
 * @packageDocumentation
 * @module API-JVM
 */
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const utxos_1 = require("./utxos");
const constants_1 = require("./constants");
const keychain_1 = require("./keychain");
const tx_1 = require("./tx");
const payload_1 = require("../../utils/payload");
const helperfunctions_1 = require("../../utils/helperfunctions");
const jrpcapi_1 = require("../../common/jrpcapi");
const constants_2 = require("../../utils/constants");
const output_1 = require("../../common/output");
const errors_1 = require("../../utils/errors");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = utils_1.Serialization.getInstance();
/**
 * Class for interacting with a node endpoint that is using the JVM.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
class JVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Juneo.addAP`${I}`]] method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL Defaults to the string "/ext/bc/X" as the path to blockchain's baseURL
     * @param blockchainID The Blockchain"s ID. Defaults to an empty string: ""
     */
    constructor(core, baseURL = "/ext/bc/X", blockchainID = "") {
        super(core, baseURL);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain("", "");
        this.blockchainID = "";
        this.blockchainAlias = undefined;
        this.JUNEAssetID = undefined;
        this.txFee = undefined;
        this.creationTxFee = undefined;
        this.mintTxFee = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            if (typeof this.blockchainAlias === "undefined") {
                const netid = this.core.getNetworkID();
                if (netid in constants_2.Defaults.network &&
                    this.blockchainID in constants_2.Defaults.network[`${netid}`]) {
                    this.blockchainAlias =
                        constants_2.Defaults.network[`${netid}`][this.blockchainID]["alias"];
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
         * @returns The blockchainID
         */
        this.refreshBlockchainID = (blockchainID = undefined) => {
            const netid = this.core.getNetworkID();
            if (typeof blockchainID === "undefined" &&
                typeof constants_2.Defaults.network[`${netid}`] !== "undefined") {
                this.blockchainID = constants_2.Defaults.network[`${netid}`].X.blockchainID; //default to X-Chain
                return true;
            }
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
            return bintools.parseAddress(addr, blockchainID, alias, constants_1.JVMConstants.ADDRESSLENGTH);
        };
        this.addressFromBuffer = (address) => {
            const chainID = this.getBlockchainAlias()
                ? this.getBlockchainAlias()
                : this.getBlockchainID();
            const type = "bech32";
            const hrp = this.core.getHRP();
            return serialization.bufferToType(address, type, hrp, chainID);
        };
        /**
         * Fetches the JUNE AssetID and returns it in a Promise.
         *
         * @param refresh This function caches the response. Refresh = true will bust the cache.
         *
         * @returns The the provided string representing the JUNE AssetID
         */
        this.getJUNEAssetID = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.JUNEAssetID === "undefined" || refresh) {
                const asset = yield this.getAssetDescription(constants_2.PrimaryAssetAlias);
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
            return this.core.getNetworkID() in constants_2.Defaults.network
                ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["X"]["txFee"])
                : new bn_js_1.default(0);
        };
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
         * Sets the tx fee for this chain.
         *
         * @param fee The tx fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setTxFee = (fee) => {
            this.txFee = fee;
        };
        /**
         * Gets the default creation fee for this chain.
         *
         * @returns The default creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultCreationTxFee = () => {
            return this.core.getNetworkID() in constants_2.Defaults.network
                ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["X"]["creationTxFee"])
                : new bn_js_1.default(0);
        };
        /**
         * Gets the default mint fee for this chain.
         *
         * @returns The default mint fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultMintTxFee = () => {
            return this.core.getNetworkID() in constants_2.Defaults.network
                ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["X"]["mintTxFee"])
                : new bn_js_1.default(0);
        };
        /**
         * Gets the mint fee for this chain.
         *
         * @returns The mint fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getMintTxFee = () => {
            if (typeof this.mintTxFee === "undefined") {
                this.mintTxFee = this.getDefaultMintTxFee();
            }
            return this.mintTxFee;
        };
        /**
         * Gets the creation fee for this chain.
         *
         * @returns The creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreationTxFee = () => {
            if (typeof this.creationTxFee === "undefined") {
                this.creationTxFee = this.getDefaultCreationTxFee();
            }
            return this.creationTxFee;
        };
        /**
         * Sets the mint fee for this chain.
         *
         * @param fee The mint fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setMintTxFee = (fee) => {
            this.mintTxFee = fee;
        };
        /**
         * Sets the creation fee for this chain.
         *
         * @param fee The creation fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setCreationTxFee = (fee) => {
            this.creationTxFee = fee;
        };
        /**
         * Gets a reference to the keychain for this class.
         *
         * @returns The instance of [[KeyChain]] for this class
         */
        this.keyChain = () => this.keychain;
        /**
         * @ignore
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
         * Helper function which determines if a tx is a goose egg transaction.
         *
         * @param utx An UnsignedTx
         *
         * @returns boolean true if passes goose egg test and false if fails.
         *
         * @remarks
         * A "Goose Egg Transaction" is when the fee far exceeds a reasonable amount
         */
        this.checkGooseEgg = (utx, outTotal = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            const juneAssetID = yield this.getJUNEAssetID();
            const outputTotal = outTotal.gt(new bn_js_1.default(0))
                ? outTotal
                : utx.getOutputTotal(juneAssetID);
            const fee = utx.getBurn(juneAssetID);
            if (fee.lte(constants_2.ONEJUNE.mul(new bn_js_1.default(10))) || fee.lte(outputTotal)) {
                return true;
            }
            else {
                return false;
            }
        });
        /**
         * Gets the balance of a particular asset on a blockchain.
         *
         * @param address The address to pull the asset balance from
         * @param assetID The assetID to pull the balance from
         * @param includePartial If includePartial=false, returns only the balance held solely
         *
         * @returns Promise with the balance of the assetID as a {@link https://github.com/indutny/bn.js/|BN} on the provided address for the blockchain.
         */
        this.getBalance = (address, assetID, includePartial = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - JVMAPI.getBalance: Invalid address format");
            }
            const params = {
                address,
                assetID,
                includePartial
            };
            const response = yield this.callMethod("jvm.getBalance", params);
            return response.data.result;
        });
        /**
         * Creates an address (and associated private keys) on a user on a blockchain.
         *
         * @param username Name of the user to create the address under
         * @param password Password to unlock the user and encrypt the private key
         *
         * @returns Promise for a string representing the address created by the vm.
         */
        this.createAddress = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("jvm.createAddress", params);
            return response.data.result.address;
        });
        /**
         * Create a new fixed-cap, fungible asset. A quantity of it is created at initialization and there no more is ever created.
         *
         * @param username The user paying the transaction fee (in $JUNE) for asset creation
         * @param password The password for the user paying the transaction fee (in $JUNE) for asset creation
         * @param name The human-readable name for the asset
         * @param symbol Optional. The shorthand symbol for the asset. Between 0 and 4 characters
         * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
         * @param initialHolders An array of objects containing the field "address" and "amount" to establish the genesis values for the new asset
         *
         * ```js
         * Example initialHolders:
         * [
         *   {
         *     "address": "X-june1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
         *     "amount": 10000
         *   },
         *   {
         *     "address": "X-june1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
         *     "amount": 50000
         *   }
         * ]
         * ```
         *
         * @returns Returns a Promise string containing the base 58 string representation of the ID of the newly created asset.
         */
        this.createFixedCapAsset = (username, password, name, symbol, denomination, initialHolders) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                name,
                symbol,
                denomination,
                username,
                password,
                initialHolders
            };
            const response = yield this.callMethod("jvm.createFixedCapAsset", params);
            return response.data.result.assetID;
        });
        /**
         * Create a new variable-cap, fungible asset. No units of the asset exist at initialization. Minters can mint units of this asset using createMintTx, signMintTx and sendMintTx.
         *
         * @param username The user paying the transaction fee (in $JUNE) for asset creation
         * @param password The password for the user paying the transaction fee (in $JUNE) for asset creation
         * @param name The human-readable name for the asset
         * @param symbol Optional. The shorthand symbol for the asset -- between 0 and 4 characters
         * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
         * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
         *
         * ```js
         * Example minterSets:
         * [
         *    {
         *      "minters":[
         *        "X-june1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr"
         *      ],
         *      "threshold": 1
         *     },
         *     {
         *      "minters": [
         *        "X-june1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
         *        "X-june1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
         *        "X-june1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx"
         *      ],
         *      "threshold": 2
         *     }
         * ]
         * ```
         *
         * @returns Returns a Promise string containing the base 58 string representation of the ID of the newly created asset.
         */
        this.createVariableCapAsset = (username, password, name, symbol, denomination, minterSets) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                name,
                symbol,
                denomination,
                username,
                password,
                minterSets
            };
            const response = yield this.callMethod("jvm.createVariableCapAsset", params);
            return response.data.result.assetID;
        });
        /**
         * Creates a family of NFT Asset. No units of the asset exist at initialization. Minters can mint units of this asset using createMintTx, signMintTx and sendMintTx.
         *
         * @param username The user paying the transaction fee (in $JUNE) for asset creation
         * @param password The password for the user paying the transaction fee (in $JUNE) for asset creation
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param name The human-readable name for the asset
         * @param symbol Optional. The shorthand symbol for the asset -- between 0 and 4 characters
         * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
         *
         * @returns Returns a Promise string containing the base 58 string representation of the ID of the newly created asset.
         */
        this.createNFTAsset = (username, password, from = undefined, changeAddr, name, symbol, minterSet) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                name,
                symbol,
                minterSet
            };
            const caller = "createNFTAsset";
            from = this._cleanAddressArray(from, caller);
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== "undefined") {
                if (typeof this.parseAddress(changeAddr) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - JVMAPI.createNFTAsset: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            const response = yield this.callMethod("jvm.createNFTAsset", params);
            return response.data.result.assetID;
        });
        /**
         * Create an unsigned transaction to mint more of an asset.
         *
         * @param amount The units of the asset to mint
         * @param assetID The ID of the asset to mint
         * @param to The address to assign the units of the minted asset
         * @param minters Addresses of the minters responsible for signing the transaction
         *
         * @returns Returns a Promise string containing the base 58 string representation of the unsigned transaction.
         */
        this.mint = (username, password, amount, assetID, to, minters) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            if (typeof amount === "number") {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            const params = {
                username: username,
                password: password,
                amount: amnt,
                assetID: asset,
                to,
                minters
            };
            const response = yield this.callMethod("jvm.mint", params);
            return response.data.result.txID;
        });
        /**
         * Mint non-fungible tokens which were created with JVMAPI.createNFTAsset
         *
         * @param username The user paying the transaction fee (in $JUNE) for asset creation
         * @param password The password for the user paying the transaction fee (in $JUNE) for asset creation
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param assetID The asset id which is being sent
         * @param to Address on X-Chain of the account to which this NFT is being sent
         * @param encoding Optional.  is the encoding format to use for the payload argument. Can be either "cb58" or "hex". Defaults to "hex".
         *
         * @returns ID of the transaction
         */
        this.mintNFT = (username, password, from = undefined, changeAddr = undefined, payload, assetID, to, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            let asset;
            if (typeof this.parseAddress(to) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - JVMAPI.mintNFT: Invalid address format");
            }
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            const params = {
                username,
                password,
                assetID: asset,
                payload,
                to,
                encoding
            };
            const caller = "mintNFT";
            from = this._cleanAddressArray(from, caller);
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== "undefined") {
                if (typeof this.parseAddress(changeAddr) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - JVMAPI.mintNFT: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            const response = yield this.callMethod("jvm.mintNFT", params);
            return response.data.result.txID;
        });
        /**
         * Send NFT from one account to another on X-Chain
         *
         * @param username The user paying the transaction fee (in $JUNE) for asset creation
         * @param password The password for the user paying the transaction fee (in $JUNE) for asset creation
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param assetID The asset id which is being sent
         * @param groupID The group this NFT is issued to.
         * @param to Address on X-Chain of the account to which this NFT is being sent
         *
         * @returns ID of the transaction
         */
        this.sendNFT = (username, password, from = undefined, changeAddr = undefined, assetID, groupID, to) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            if (typeof this.parseAddress(to) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - JVMAPI.sendNFT: Invalid address format");
            }
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            const params = {
                username,
                password,
                assetID: asset,
                groupID,
                to
            };
            const caller = "sendNFT";
            from = this._cleanAddressArray(from, caller);
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== "undefined") {
                if (typeof this.parseAddress(changeAddr) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - JVMAPI.sendNFT: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            const response = yield this.callMethod("jvm.sendNFT", params);
            return response.data.result.txID;
        });
        /**
         * Exports the private key for an address.
         *
         * @param username The name of the user with the private key
         * @param password The password used to decrypt the private key
         * @param address The address whose private key should be exported
         *
         * @returns Promise with the decrypted private key as store in the database
         */
        this.exportKey = (username, password, address) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - JVMAPI.exportKey: Invalid address format");
            }
            const params = {
                username,
                password,
                address
            };
            const response = yield this.callMethod("jvm.exportKey", params);
            return response.data.result.privateKey;
        });
        /**
         * Imports a private key into the node's keystore under an user and for a blockchain.
         *
         * @param username The name of the user to store the private key
         * @param password The password that unlocks the user
         * @param privateKey A string representing the private key in the vm's format
         *
         * @returns The address for the imported private key.
         */
        this.importKey = (username, password, privateKey) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                privateKey
            };
            const response = yield this.callMethod("jvm.importKey", params);
            return response.data.result.address;
        });
        /**
         * Send ANT (Juneo Native Token) assets including JUNE from the X-Chain to an account on the P-Chain or C-Chain.
         *
         * After calling this method, you must call the P-Chain's `import` or the C-Chain’s `import` method to complete the transfer.
         *
         * @param username The Keystore user that controls the P-Chain or C-Chain account specified in `to`
         * @param password The password of the Keystore user
         * @param to The account on the P-Chain or C-Chain to send the asset to.
         * @param amount Amount of asset to export as a {@link https://github.com/indutny/bn.js/|BN}
         * @param assetID The asset id which is being sent
         *
         * @returns String representing the transaction id
         */
        this.export = (username, password, to, amount, assetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                to,
                amount: amount,
                assetID
            };
            const response = yield this.callMethod("jvm.export", params);
            return response.data.result.txID;
        });
        /**
         * Send ANT (Juneo Native Token) assets including JUNE from an account on the P-Chain or C-Chain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the asset is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the asset is sent to.
         * @param sourceChain The chainID where the funds are coming from. Ex: "C"
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.import = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                to,
                sourceChain
            };
            const response = yield this.callMethod("jvm.import", params);
            return response.data.result.txID;
        });
        /**
         * Lists all the addresses under a user.
         *
         * @param username The user to list addresses
         * @param password The password of the user to list the addresses
         *
         * @returns Promise of an array of address strings in the format specified by the blockchain.
         */
        this.listAddresses = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("jvm.listAddresses", params);
            return response.data.result.addresses;
        });
        /**
         * Retrieves all assets for an address on a server and their associated balances.
         *
         * @param address The address to get a list of assets
         *
         * @returns Promise of an object mapping assetID strings with {@link https://github.com/indutny/bn.js/|BN} balance for the address on the blockchain.
         */
        this.getAllBalances = (address) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - JVMAPI.getAllBalances: Invalid address format");
            }
            const params = {
                address
            };
            const response = yield this.callMethod("jvm.getAllBalances", params);
            return response.data.result.balances;
        });
        /**
         * Retrieves an assets name and symbol.
         *
         * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an b58 serialized string for the AssetID or its alias.
         *
         * @returns Returns a Promise object with keys "name" and "symbol".
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
            const response = yield this.callMethod("jvm.getAssetDescription", params);
            return {
                name: response.data.result.name,
                symbol: response.data.result.symbol,
                assetID: bintools.cb58Decode(response.data.result.assetID),
                denomination: parseInt(response.data.result.denomination, 10)
            };
        });
        /**
         * Returns the transaction data of a provided transaction ID by calling the node's `getTx` method.
         *
         * @param txID The string representation of the transaction ID
         * @param encoding sets the format of the returned transaction. Can be, "cb58", "hex" or "json". Defaults to "cb58".
         *
         * @returns Returns a Promise string or object containing the bytes retrieved from the node
         */
        this.getTx = (txID, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID,
                encoding
            };
            const response = yield this.callMethod("jvm.getTx", params);
            return response.data.result.tx;
        });
        /**
         * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
         *
         * @param txID The string representation of the transaction ID
         *
         * @returns Returns a Promise string containing the status retrieved from the node
         */
        this.getTxStatus = (txID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID
            };
            const response = yield this.callMethod("jvm.getTxStatus", params);
            return response.data.result.status;
        });
        /**
         * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param sourceChain A string for the chain to look for the UTXO's. Default is to use this chain, but if exported UTXOs exist from other chains, this can used to pull them instead.
         * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
         * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
         * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
         * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
         * @param persistOpts Options available to persist these UTXOs in local storage
         *
         * @remarks
         * persistOpts is optional and must be of type [[PersistanceOptions]]
         *
         */
        this.getUTXOs = (addresses, sourceChain = undefined, limit = 0, startIndex = undefined, persistOpts = undefined, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
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
            const response = yield this.callMethod("jvm.getUTXOs", params);
            const utxos = new utxos_1.UTXOSet();
            let data = response.data.result.utxos;
            if (persistOpts && typeof persistOpts === "object") {
                if (this.db.has(persistOpts.getName())) {
                    const selfArray = this.db.get(persistOpts.getName());
                    if (Array.isArray(selfArray)) {
                        utxos.addArray(data);
                        const utxoSet = new utxos_1.UTXOSet();
                        utxoSet.addArray(selfArray);
                        utxoSet.mergeByRule(utxos, persistOpts.getMergeRule());
                        data = utxoSet.getAllUTXOStrings();
                    }
                }
                this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite());
            }
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
         * Helper function which creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount of AssetID to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
         * @param assetID The assetID of the value being sent
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[BaseTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildBaseTx = (utxoset, amount, assetID = undefined, toAddresses, fromAddresses, changeAddresses, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildBaseTx";
            const to = this._cleanAddressArray(toAddresses, caller).map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (typeof assetID === "string") {
                assetID = bintools.cb58Decode(assetID);
            }
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const networkID = this.core.getNetworkID();
            const blockchainIDBuf = bintools.cb58Decode(this.blockchainID);
            const fee = this.getTxFee();
            const feeAssetID = yield this.getJUNEAssetID();
            const builtUnsignedTx = utxoset.buildBaseTx(networkID, blockchainIDBuf, amount, assetID, to, from, change, fee, feeAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - JVMAPI.buildBaseTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned NFT Transfer. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset  A set of UTXOs that the transaction is built on
         * @param toAddresses The addresses to send the NFT
         * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nfts this transaction is sending
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[NFTTransferTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildNFTTransferTx = (utxoset, toAddresses, fromAddresses, changeAddresses, utxoid, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildNFTTransferTx";
            const to = this._cleanAddressArray(toAddresses, caller).map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const juneAssetID = yield this.getJUNEAssetID();
            let utxoidArray = [];
            if (typeof utxoid === "string") {
                utxoidArray = [utxoid];
            }
            else if (Array.isArray(utxoid)) {
                utxoidArray = utxoid;
            }
            const builtUnsignedTx = utxoset.buildNFTTransferTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, utxoidArray, this.getTxFee(), juneAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - JVMAPI.buildNFTTransferTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset  A set of UTXOs that the transaction is built on
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildImportTx = (utxoset, ownerAddresses, sourceChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildImportTx";
            const to = this._cleanAddressArray(toAddresses, caller).map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            let srcChain = undefined;
            if (typeof sourceChain === "undefined") {
                throw new errors_1.ChainIdError("Error - JVMAPI.buildImportTx: Source ChainID is undefined.");
            }
            else if (typeof sourceChain === "string") {
                srcChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (!(sourceChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - JVMAPI.buildImportTx: Invalid destinationChain type: " +
                    typeof sourceChain);
            }
            const atomicUTXOs = (yield this.getUTXOs(ownerAddresses, srcChain, 0, undefined)).utxos;
            const juneAssetID = yield this.getJUNEAssetID();
            const atomics = atomicUTXOs.getAllUTXOs();
            if (atomics.length === 0) {
                throw new errors_1.NoAtomicUTXOsError("Error - JVMAPI.buildImportTx: No atomic UTXOs to import from " +
                    srcChain +
                    " using addresses: " +
                    ownerAddresses.join(", "));
            }
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const builtUnsignedTx = utxoset.buildImportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, atomics, sourceChain, this.getTxFee(), juneAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - JVMAPI.buildImportTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param destinationChain The chainid for where the assets will be sent.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param assetID Optional. The assetID of the asset to send. Defaults to JUNE assetID.
         * @param feeToExport Optional. The amount being exported to destination chain to use as a fee
         * Regardless of the asset which you"re exporting, all fees are paid in JUNE.
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (utxoset, amount, destinationChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1, assetID = undefined, feeToExport = undefined) => __awaiter(this, void 0, void 0, function* () {
            const prefixes = {};
            toAddresses.map((a) => {
                prefixes[a.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new errors_1.AddressError("Error - JVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new errors_1.ChainIdError("Error - JVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain); //
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - JVMAPI.buildExportTx: Invalid destinationChain type: " +
                    typeof destinationChain);
            }
            if (destinationChain.length !== 32) {
                throw new errors_1.ChainIdError("Error - JVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
            const to = [];
            toAddresses.map((a) => {
                to.push(bintools.stringToAddress(a));
            });
            const caller = "buildExportTx";
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const juneAssetID = yield this.getJUNEAssetID();
            if (typeof assetID === "undefined") {
                assetID = bintools.cb58Encode(juneAssetID);
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const assetIDBuf = bintools.cb58Decode(assetID);
            const fee = this.getTxFee();
            const builtUnsignedTx = utxoset.buildExportTx(networkID, blockchainID, amount, assetIDBuf, to, from, change, destinationChain, fee, juneAssetID, memo, asOf, locktime, threshold, feeToExport);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - JVMAPI.buildExportTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param initialState The [[InitialStates]] that represent the intial state of a created asset
         * @param name String for the descriptive name of the asset
         * @param symbol String for the ticker symbol of the asset
         * @param denomination Number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 JUNE = 10^9 $nJUNE
         * @param mintOutputs Optional. Array of [[SECPMintOutput]]s to be included in the transaction. These outputs can be spent to mint more tokens.
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
         *
         */
        this.buildCreateAssetTx = (utxoset, fromAddresses, changeAddresses, initialStates, name, symbol, denomination, mintOutputs = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildCreateAssetTx";
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (symbol.length > constants_1.JVMConstants.SYMBOLMAXLEN) {
                throw new errors_1.SymbolError("Error - JVMAPI.buildCreateAssetTx: Symbols may not exceed length of " +
                    constants_1.JVMConstants.SYMBOLMAXLEN);
            }
            if (name.length > constants_1.JVMConstants.ASSETNAMELEN) {
                throw new errors_1.NameError("Error - JVMAPI.buildCreateAssetTx: Names may not exceed length of " +
                    constants_1.JVMConstants.ASSETNAMELEN);
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const juneAssetID = yield this.getJUNEAssetID();
            const fee = this.getDefaultCreationTxFee();
            const builtUnsignedTx = utxoset.buildCreateAssetTx(networkID, blockchainID, from, change, initialStates, name, symbol, denomination, mintOutputs, fee, juneAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, fee))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - JVMAPI.buildCreateAssetTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        this.buildSECPMintTx = (utxoset, mintOwner, transferOwner, fromAddresses, changeAddresses, mintUTXOID, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildSECPMintTx";
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const juneAssetID = yield this.getJUNEAssetID();
            const fee = this.getMintTxFee();
            const builtUnsignedTx = utxoset.buildSECPMintTx(networkID, blockchainID, mintOwner, transferOwner, from, change, mintUTXOID, fee, juneAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - JVMAPI.buildSECPMintTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
         * @param name String for the descriptive name of the asset
         * @param symbol String for the ticker symbol of the asset
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting mint output
         *
         * ```js
         * Example minterSets:
         * [
         *      {
         *          "minters":[
         *              "X-june1ghstjukrtw8935lryqtnh643xe9a94u3tc75c7"
         *          ],
         *          "threshold": 1
         *      },
         *      {
         *          "minters": [
         *              "X-june1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx",
         *              "X-june1k4nr26c80jaquzm9369j5a4shmwcjn0vmemcjz",
         *              "X-june1ztkzsrjnkn0cek5ryvhqswdtcg23nhge3nnr5e"
         *          ],
         *          "threshold": 2
         *      }
         * ]
         * ```
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
         *
         */
        this.buildCreateNFTAssetTx = (utxoset, fromAddresses, changeAddresses, minterSets, name, symbol, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildCreateNFTAssetTx";
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (name.length > constants_1.JVMConstants.ASSETNAMELEN) {
                /* istanbul ignore next */
                throw new errors_1.NameError("Error - JVMAPI.buildCreateNFTAssetTx: Names may not exceed length of " +
                    constants_1.JVMConstants.ASSETNAMELEN);
            }
            if (symbol.length > constants_1.JVMConstants.SYMBOLMAXLEN) {
                /* istanbul ignore next */
                throw new errors_1.SymbolError("Error - JVMAPI.buildCreateNFTAssetTx: Symbols may not exceed length of " +
                    constants_1.JVMConstants.SYMBOLMAXLEN);
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const creationTxFee = this.getCreationTxFee();
            const juneAssetID = yield this.getJUNEAssetID();
            const builtUnsignedTx = utxoset.buildCreateNFTAssetTx(networkID, blockchainID, from, change, minterSets, name, symbol, creationTxFee, juneAssetID, memo, asOf, locktime);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, creationTxFee))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - JVMAPI.buildCreateNFTAssetTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset  A set of UTXOs that the transaction is built on
         * @param owners Either a single or an array of [[OutputOwners]] to send the nft output
         * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nft mint output this transaction is sending
         * @param groupID Optional. The group this NFT is issued to.
         * @param payload Optional. Data for NFT Payload as either a [[PayloadBase]] or a {@link https://github.com/feross/buffer|Buffer}
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[OperationTx]].
         *
         */
        this.buildCreateNFTMintTx = (utxoset, owners, fromAddresses, changeAddresses, utxoid, groupID = 0, payload = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildCreateNFTMintTx";
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (payload instanceof payload_1.PayloadBase) {
                payload = payload.getPayload();
            }
            if (typeof utxoid === "string") {
                utxoid = [utxoid];
            }
            const juneAssetID = yield this.getJUNEAssetID();
            if (owners instanceof output_1.OutputOwners) {
                owners = [owners];
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const txFee = this.getTxFee();
            const builtUnsignedTx = utxoset.buildCreateNFTMintTx(networkID, blockchainID, owners, from, change, utxoid, groupID, payload, txFee, juneAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - JVMAPI.buildCreateNFTMintTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which takes an unsigned transaction and signs it, returning the resulting [[Tx]].
         *
         * @param utx The unsigned transaction of type [[UnsignedTx]]
         *
         * @returns A signed transaction of type [[Tx]]
         */
        this.signTx = (utx) => utx.sign(this.keychain);
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
                throw new errors_1.TransactionError("Error - JVMAPI.issueTx: provided tx is not expected type of string, Buffer, or Tx");
            }
            const params = {
                tx: Transaction.toString(),
                encoding: "hex"
            };
            const response = yield this.callMethod("jvm.issueTx", params);
            return response.data.result.txID;
        });
        /**
         * Calls the node's getAddressTxs method from the API and returns transactions corresponding to the provided address and assetID
         *
         * @param address The address for which we're fetching related transactions.
         * @param cursor Page number or offset.
         * @param pageSize  Number of items to return per page. Optional. Defaults to 1024. If [pageSize] == 0 or [pageSize] > [maxPageSize], then it fetches at max [maxPageSize] transactions
         * @param assetID Only return transactions that changed the balance of this asset. Must be an ID or an alias for an asset.
         *
         * @returns A promise object representing the array of transaction IDs and page offset
         */
        this.getAddressTxs = (address, cursor, pageSize, assetID) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let pageSizeNum;
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            if (typeof pageSize !== "number") {
                pageSizeNum = 0;
            }
            else {
                pageSizeNum = pageSize;
            }
            const params = {
                address,
                cursor,
                pageSize: pageSizeNum,
                assetID: asset
            };
            const response = yield this.callMethod("jvm.getAddressTxs", params);
            return response.data.result;
        });
        /**
         * Sends an amount of assetID to the specified address from a list of owned of addresses.
         *
         * @param username The user that owns the private keys associated with the `from` addresses
         * @param password The password unlocking the user
         * @param assetID The assetID of the asset to send
         * @param amount The amount of the asset to be sent
         * @param to The address of the recipient
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param memo Optional. CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         *
         * @returns Promise for the string representing the transaction's ID.
         */
        this.send = (username, password, assetID, amount, to, from = undefined, changeAddr = undefined, memo = undefined) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            if (typeof this.parseAddress(to) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - JVMAPI.send: Invalid address format");
            }
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            if (typeof amount === "number") {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            const params = {
                username: username,
                password: password,
                assetID: asset,
                amount: amnt.toString(10),
                to: to
            };
            const caller = "send";
            from = this._cleanAddressArray(from, caller);
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== "undefined") {
                if (typeof this.parseAddress(changeAddr) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - JVMAPI.send: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            if (typeof memo !== "undefined") {
                if (typeof memo !== "string") {
                    params["memo"] = bintools.cb58Encode(memo);
                }
                else {
                    params["memo"] = memo;
                }
            }
            const response = yield this.callMethod("jvm.send", params);
            return response.data.result;
        });
        /**
         * Sends an amount of assetID to an array of specified addresses from a list of owned of addresses.
         *
         * @param username The user that owns the private keys associated with the `from` addresses
         * @param password The password unlocking the user
         * @param sendOutputs The array of SendOutputs. A SendOutput is an object literal which contains an assetID, amount, and to.
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param memo Optional. CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         *
         * @returns Promise for the string representing the transaction"s ID.
         */
        this.sendMultiple = (username, password, sendOutputs, from = undefined, changeAddr = undefined, memo = undefined) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            const sOutputs = [];
            sendOutputs.forEach((output) => {
                if (typeof this.parseAddress(output.to) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - JVMAPI.sendMultiple: Invalid address format");
                }
                if (typeof output.assetID !== "string") {
                    asset = bintools.cb58Encode(output.assetID);
                }
                else {
                    asset = output.assetID;
                }
                if (typeof output.amount === "number") {
                    amnt = new bn_js_1.default(output.amount);
                }
                else {
                    amnt = output.amount;
                }
                sOutputs.push({
                    to: output.to,
                    assetID: asset,
                    amount: amnt.toString(10)
                });
            });
            const params = {
                username: username,
                password: password,
                outputs: sOutputs
            };
            const caller = "send";
            from = this._cleanAddressArray(from, caller);
            if (typeof from !== "undefined") {
                params.from = from;
            }
            if (typeof changeAddr !== "undefined") {
                if (typeof this.parseAddress(changeAddr) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - JVMAPI.send: Invalid address format");
                }
                params.changeAddr = changeAddr;
            }
            if (typeof memo !== "undefined") {
                if (typeof memo !== "string") {
                    params.memo = bintools.cb58Encode(memo);
                }
                else {
                    params.memo = memo;
                }
            }
            const response = yield this.callMethod("jvm.sendMultiple", params);
            return response.data.result;
        });
        /**
         * Given a JSON representation of this Virtual Machine’s genesis state, create the byte representation of that state.
         *
         * @param genesisData The blockchain's genesis data object
         *
         * @returns Promise of a string of bytes
         */
        this.buildGenesis = (genesisData) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                genesisData
            };
            const response = yield this.callMethod("jvm.buildGenesis", params);
            return response.data.result.bytes;
        });
        this.blockchainID = blockchainID;
        const netID = core.getNetworkID();
        if (netID in constants_2.Defaults.network &&
            blockchainID in constants_2.Defaults.network[`${netID}`]) {
            const alias = constants_2.Defaults.network[`${netID}`][`${blockchainID}`]["alias"];
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
        const chainID = this.getBlockchainAlias()
            ? this.getBlockchainAlias()
            : this.getBlockchainID();
        if (addresses && addresses.length > 0) {
            for (let i = 0; i < addresses.length; i++) {
                if (typeof addresses[`${i}`] === "string") {
                    if (typeof this.parseAddress(addresses[`${i}`]) ===
                        "undefined") {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - JVMAPI.${caller}: Invalid address format");
                    }
                    addrs.push(addresses[`${i}`]);
                }
                else {
                    const type = "bech32";
                    addrs.push(serialization.bufferToType(addresses[`${i}`], type, this.core.getHRP(), chainID));
                }
            }
        }
        return addrs;
    }
}
exports.JVMAPI = JVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvanZtL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxrREFBc0I7QUFDdEIsb0NBQWdDO0FBRWhDLG9FQUEyQztBQUMzQyxtQ0FBdUM7QUFDdkMsMkNBQTBDO0FBQzFDLHlDQUFxQztBQUNyQyw2QkFBcUM7QUFDckMsaURBQWlEO0FBR2pELGlFQUFxRDtBQUNyRCxrREFBOEM7QUFFOUMscURBQTRFO0FBRzVFLGdEQUFrRDtBQUVsRCwrQ0FRMkI7QUFDM0IsdUNBQTJEO0FBb0MzRDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLHFCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7Ozs7OztHQU1HO0FBQ0gsTUFBYSxNQUFPLFNBQVEsaUJBQU87SUE0OERqQzs7Ozs7O09BTUc7SUFDSCxZQUNFLElBQWUsRUFDZixVQUFrQixXQUFXLEVBQzdCLGVBQXVCLEVBQUU7UUFFekIsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQXY5RHRCOztXQUVHO1FBQ08sYUFBUSxHQUFhLElBQUksbUJBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDekMsaUJBQVksR0FBVyxFQUFFLENBQUE7UUFDekIsb0JBQWUsR0FBVyxTQUFTLENBQUE7UUFDbkMsZ0JBQVcsR0FBVyxTQUFTLENBQUE7UUFDL0IsVUFBSyxHQUFPLFNBQVMsQ0FBQTtRQUNyQixrQkFBYSxHQUFPLFNBQVMsQ0FBQTtRQUM3QixjQUFTLEdBQU8sU0FBUyxDQUFBO1FBRW5DOzs7O1dBSUc7UUFDSCx1QkFBa0IsR0FBRyxHQUFXLEVBQUU7WUFDaEMsSUFBSSxPQUFPLElBQUksQ0FBQyxlQUFlLEtBQUssV0FBVyxFQUFFO2dCQUMv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LENBQ1IsQ0FDRixDQUFBO2lCQUNGO2FBQ0Y7U0FDRjtRQUNELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztDQTRCRjtBQXQrREQsd0JBcytEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktSlZNXHJcbiAqL1xyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgSnVuZW9Db3JlIGZyb20gXCIuLi8uLi9qdW5lb1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBVVFhPLCBVVFhPU2V0IH0gZnJvbSBcIi4vdXR4b3NcIlxyXG5pbXBvcnQgeyBKVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxyXG5pbXBvcnQgeyBLZXlDaGFpbiB9IGZyb20gXCIuL2tleWNoYWluXCJcclxuaW1wb3J0IHsgVHgsIFVuc2lnbmVkVHggfSBmcm9tIFwiLi90eFwiXHJcbmltcG9ydCB7IFBheWxvYWRCYXNlIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BheWxvYWRcIlxyXG5pbXBvcnQgeyBTRUNQTWludE91dHB1dCB9IGZyb20gXCIuL291dHB1dHNcIlxyXG5pbXBvcnQgeyBJbml0aWFsU3RhdGVzIH0gZnJvbSBcIi4vaW5pdGlhbHN0YXRlc1wiXHJcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcclxuaW1wb3J0IHsgSlJQQ0FQSSB9IGZyb20gXCIuLi8uLi9jb21tb24vanJwY2FwaVwiXHJcbmltcG9ydCB7IFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaWJhc2VcIlxyXG5pbXBvcnQgeyBEZWZhdWx0cywgUHJpbWFyeUFzc2V0QWxpYXMsIE9ORUpVTkUgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgTWludGVyU2V0IH0gZnJvbSBcIi4vbWludGVyc2V0XCJcclxuaW1wb3J0IHsgUGVyc2lzdGFuY2VPcHRpb25zIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BlcnNpc3RlbmNlb3B0aW9uc1wiXHJcbmltcG9ydCB7IE91dHB1dE93bmVycyB9IGZyb20gXCIuLi8uLi9jb21tb24vb3V0cHV0XCJcclxuaW1wb3J0IHsgU0VDUFRyYW5zZmVyT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXHJcbmltcG9ydCB7XHJcbiAgQWRkcmVzc0Vycm9yLFxyXG4gIEdvb3NlRWdnQ2hlY2tFcnJvcixcclxuICBDaGFpbklkRXJyb3IsXHJcbiAgTm9BdG9taWNVVFhPc0Vycm9yLFxyXG4gIFN5bWJvbEVycm9yLFxyXG4gIE5hbWVFcnJvcixcclxuICBUcmFuc2FjdGlvbkVycm9yXHJcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRUeXBlIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCJcclxuaW1wb3J0IHtcclxuICBCdWlsZEdlbmVzaXNQYXJhbXMsXHJcbiAgQ3JlYXRlQWRkcmVzc1BhcmFtcyxcclxuICBDcmVhdGVGaXhlZENhcEFzc2V0UGFyYW1zLFxyXG4gIENyZWF0ZVZhcmlhYmxlQ2FwQXNzZXRQYXJhbXMsXHJcbiAgRXhwb3J0UGFyYW1zLFxyXG4gIEV4cG9ydEtleVBhcmFtcyxcclxuICBHZXRBbGxCYWxhbmNlc1BhcmFtcyxcclxuICBHZXRBc3NldERlc2NyaXB0aW9uUGFyYW1zLFxyXG4gIEdldEpVTkVBc3NldElEUGFyYW1zLFxyXG4gIEdldEJhbGFuY2VQYXJhbXMsXHJcbiAgR2V0VHhQYXJhbXMsXHJcbiAgR2V0VHhTdGF0dXNQYXJhbXMsXHJcbiAgR2V0VVRYT3NQYXJhbXMsXHJcbiAgSW1wb3J0UGFyYW1zLFxyXG4gIEltcG9ydEtleVBhcmFtcyxcclxuICBMaXN0QWRkcmVzc2VzUGFyYW1zLFxyXG4gIE1pbnRQYXJhbXMsXHJcbiAgU2VuZE11bHRpcGxlUGFyYW1zLFxyXG4gIFNPdXRwdXRzUGFyYW1zLFxyXG4gIEdldFVUWE9zUmVzcG9uc2UsXHJcbiAgR2V0QXNzZXREZXNjcmlwdGlvblJlc3BvbnNlLFxyXG4gIEdldEJhbGFuY2VSZXNwb25zZSxcclxuICBTZW5kUGFyYW1zLFxyXG4gIFNlbmRSZXNwb25zZSxcclxuICBTZW5kTXVsdGlwbGVSZXNwb25zZSxcclxuICBHZXRBZGRyZXNzVHhzUGFyYW1zLFxyXG4gIEdldEFkZHJlc3NUeHNSZXNwb25zZSxcclxuICBDcmVhdGVORlRBc3NldFBhcmFtcyxcclxuICBTZW5kTkZUUGFyYW1zLFxyXG4gIE1pbnRORlRQYXJhbXMsXHJcbiAgSU1pbnRlclNldFxyXG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxyXG5pbXBvcnQgeyBJc3N1ZVR4UGFyYW1zIH0gZnJvbSBcIi4uLy4uL2NvbW1vblwiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIGludGVyYWN0aW5nIHdpdGggYSBub2RlIGVuZHBvaW50IHRoYXQgaXMgdXNpbmcgdGhlIEpWTS5cclxuICpcclxuICogQGNhdGVnb3J5IFJQQ0FQSXNcclxuICpcclxuICogQHJlbWFya3MgVGhpcyBleHRlbmRzIHRoZSBbW0pSUENBUEldXSBjbGFzcy4gVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGRpcmVjdGx5IGNhbGxlZC4gSW5zdGVhZCwgdXNlIHRoZSBbW0p1bmVvLmFkZEFQSV1dIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIHRoaXMgaW50ZXJmYWNlIHdpdGggSnVuZW8uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgSlZNQVBJIGV4dGVuZHMgSlJQQ0FQSSB7XHJcbiAgLyoqXHJcbiAgICogQGlnbm9yZVxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBrZXljaGFpbjogS2V5Q2hhaW4gPSBuZXcgS2V5Q2hhaW4oXCJcIiwgXCJcIilcclxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbklEOiBzdHJpbmcgPSBcIlwiXHJcbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5BbGlhczogc3RyaW5nID0gdW5kZWZpbmVkXHJcbiAgcHJvdGVjdGVkIEpVTkVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWRcclxuICBwcm90ZWN0ZWQgdHhGZWU6IEJOID0gdW5kZWZpbmVkXHJcbiAgcHJvdGVjdGVkIGNyZWF0aW9uVHhGZWU6IEJOID0gdW5kZWZpbmVkXHJcbiAgcHJvdGVjdGVkIG1pbnRUeEZlZTogQk4gPSB1bmRlZmluZWRcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSUQgaWYgaXQgZXhpc3RzLCBvdGhlcndpc2UgcmV0dXJucyBgdW5kZWZpbmVkYC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRFxyXG4gICAqL1xyXG4gIGdldEJsb2NrY2hhaW5BbGlhcyA9ICgpOiBzdHJpbmcgPT4ge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBjb25zdCBuZXRpZDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXHJcbiAgICAgIGlmIChcclxuICAgICAgICBuZXRpZCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmXHJcbiAgICAgICAgdGhpcy5ibG9ja2NoYWluSUQgaW4gRGVmYXVsdHMubmV0d29ya1tgJHtuZXRpZH1gXVxyXG4gICAgICApIHtcclxuICAgICAgICB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9XHJcbiAgICAgICAgICBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldGlkfWBdW3RoaXMuYmxvY2tjaGFpbklEXVtcImFsaWFzXCJdXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tjaGFpbkFsaWFzXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmJsb2NrY2hhaW5BbGlhc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYWxpYXMgVGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklELlxyXG4gICAqXHJcbiAgICovXHJcbiAgc2V0QmxvY2tjaGFpbkFsaWFzID0gKGFsaWFzOiBzdHJpbmcpOiB1bmRlZmluZWQgPT4ge1xyXG4gICAgdGhpcy5ibG9ja2NoYWluQWxpYXMgPSBhbGlhc1xyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIHJldHVybiB1bmRlZmluZWRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGJsb2NrY2hhaW5JRCBhbmQgcmV0dXJucyBpdC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBibG9ja2NoYWluSURcclxuICAgKi9cclxuICBnZXRCbG9ja2NoYWluSUQgPSAoKTogc3RyaW5nID0+IHRoaXMuYmxvY2tjaGFpbklEXHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZnJlc2ggYmxvY2tjaGFpbklELCBhbmQgaWYgYSBibG9ja2NoYWluSUQgaXMgcGFzc2VkIGluLCB1c2UgdGhhdC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBPcHRpb25hbC4gQmxvY2tjaGFpbklEIHRvIGFzc2lnbiwgaWYgbm9uZSwgdXNlcyB0aGUgZGVmYXVsdCBiYXNlZCBvbiBuZXR3b3JrSUQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXHJcbiAgICovXHJcbiAgcmVmcmVzaEJsb2NrY2hhaW5JRCA9IChibG9ja2NoYWluSUQ6IHN0cmluZyA9IHVuZGVmaW5lZCk6IGJvb2xlYW4gPT4ge1xyXG4gICAgY29uc3QgbmV0aWQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxyXG4gICAgaWYgKFxyXG4gICAgICB0eXBlb2YgYmxvY2tjaGFpbklEID09PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICAgIHR5cGVvZiBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldGlkfWBdICE9PSBcInVuZGVmaW5lZFwiXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldGlkfWBdLlguYmxvY2tjaGFpbklEIC8vZGVmYXVsdCB0byBYLUNoYWluXHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIGJsb2NrY2hhaW5JRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJsb2NrY2hhaW5JRFxyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhbiBhZGRyZXNzIHN0cmluZyBhbmQgcmV0dXJucyBpdHMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gaWYgdmFsaWQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCwgdW5kZWZpbmVkIGlmIG5vdCB2YWxpZC5cclxuICAgKi9cclxuICBwYXJzZUFkZHJlc3MgPSAoYWRkcjogc3RyaW5nKTogQnVmZmVyID0+IHtcclxuICAgIGNvbnN0IGFsaWFzOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXHJcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcclxuICAgIHJldHVybiBiaW50b29scy5wYXJzZUFkZHJlc3MoXHJcbiAgICAgIGFkZHIsXHJcbiAgICAgIGJsb2NrY2hhaW5JRCxcclxuICAgICAgYWxpYXMsXHJcbiAgICAgIEpWTUNvbnN0YW50cy5BRERSRVNTTEVOR1RIXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBhZGRyZXNzRnJvbUJ1ZmZlciA9IChhZGRyZXNzOiBCdWZmZXIpOiBzdHJpbmcgPT4ge1xyXG4gICAgY29uc3QgY2hhaW5JRDogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxyXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcclxuICAgICAgOiB0aGlzLmdldEJsb2NrY2hhaW5JRCgpXHJcbiAgICBjb25zdCB0eXBlOiBTZXJpYWxpemVkVHlwZSA9IFwiYmVjaDMyXCJcclxuICAgIGNvbnN0IGhycDogc3RyaW5nID0gdGhpcy5jb3JlLmdldEhSUCgpXHJcbiAgICByZXR1cm4gc2VyaWFsaXphdGlvbi5idWZmZXJUb1R5cGUoYWRkcmVzcywgdHlwZSwgaHJwLCBjaGFpbklEKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2hlcyB0aGUgSlVORSBBc3NldElEIGFuZCByZXR1cm5zIGl0IGluIGEgUHJvbWlzZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByZWZyZXNoIFRoaXMgZnVuY3Rpb24gY2FjaGVzIHRoZSByZXNwb25zZS4gUmVmcmVzaCA9IHRydWUgd2lsbCBidXN0IHRoZSBjYWNoZS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgSlVORSBBc3NldElEXHJcbiAgICovXHJcbiAgZ2V0SlVORUFzc2V0SUQgPSBhc3luYyAocmVmcmVzaDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxCdWZmZXI+ID0+IHtcclxuICAgIGlmICh0eXBlb2YgdGhpcy5KVU5FQXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIiB8fCByZWZyZXNoKSB7XHJcbiAgICAgIGNvbnN0IGFzc2V0OiBHZXRKVU5FQXNzZXRJRFBhcmFtcyA9IGF3YWl0IHRoaXMuZ2V0QXNzZXREZXNjcmlwdGlvbihcclxuICAgICAgICBQcmltYXJ5QXNzZXRBbGlhc1xyXG4gICAgICApXHJcbiAgICAgIHRoaXMuSlVORUFzc2V0SUQgPSBhc3NldC5hc3NldElEXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5KVU5FQXNzZXRJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3ZlcnJpZGVzIHRoZSBkZWZhdWx0cyBhbmQgc2V0cyB0aGUgY2FjaGUgdG8gYSBzcGVjaWZpYyBKVU5FIEFzc2V0SURcclxuICAgKlxyXG4gICAqIEBwYXJhbSBqdW5lQXNzZXRJRCBBIGNiNTggc3RyaW5nIG9yIEJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIEpVTkUgQXNzZXRJRFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBKVU5FIEFzc2V0SURcclxuICAgKi9cclxuICBzZXRKVU5FQXNzZXRJRCA9IChqdW5lQXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyKSA9PiB7XHJcbiAgICBpZiAodHlwZW9mIGp1bmVBc3NldElEID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIGp1bmVBc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShqdW5lQXNzZXRJRClcclxuICAgIH1cclxuICAgIHRoaXMuSlVORUFzc2V0SUQgPSBqdW5lQXNzZXRJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgZGVmYXVsdCB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqL1xyXG4gIGdldERlZmF1bHRUeEZlZSA9ICgpOiBCTiA9PiB7XHJcbiAgICByZXR1cm4gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpIGluIERlZmF1bHRzLm5ldHdvcmtcclxuICAgICAgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiWFwiXVtcInR4RmVlXCJdKVxyXG4gICAgICA6IG5ldyBCTigwKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgdHggZmVlIGZvciB0aGlzIGNoYWluLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIHR4IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICovXHJcbiAgZ2V0VHhGZWUgPSAoKTogQk4gPT4ge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnR4RmVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMudHhGZWUgPSB0aGlzLmdldERlZmF1bHRUeEZlZSgpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy50eEZlZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdHggZmVlIGZvciB0aGlzIGNoYWluLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGZlZSBUaGUgdHggZmVlIGFtb3VudCB0byBzZXQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKi9cclxuICBzZXRUeEZlZSA9IChmZWU6IEJOKTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLnR4RmVlID0gZmVlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBkZWZhdWx0IGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IGNyZWF0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICovXHJcbiAgZ2V0RGVmYXVsdENyZWF0aW9uVHhGZWUgPSAoKTogQk4gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSBpbiBEZWZhdWx0cy5uZXR3b3JrXHJcbiAgICAgID8gbmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIlhcIl1bXCJjcmVhdGlvblR4RmVlXCJdKVxyXG4gICAgICA6IG5ldyBCTigwKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgZGVmYXVsdCBtaW50IGZlZSBmb3IgdGhpcyBjaGFpbi5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IG1pbnQgZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKi9cclxuICBnZXREZWZhdWx0TWludFR4RmVlID0gKCk6IEJOID0+IHtcclxuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xyXG4gICAgICA/IG5ldyBCTihEZWZhdWx0cy5uZXR3b3JrW3RoaXMuY29yZS5nZXROZXR3b3JrSUQoKV1bXCJYXCJdW1wibWludFR4RmVlXCJdKVxyXG4gICAgICA6IG5ldyBCTigwKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbWludCBmZWUgZm9yIHRoaXMgY2hhaW4uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgbWludCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqL1xyXG4gIGdldE1pbnRUeEZlZSA9ICgpOiBCTiA9PiB7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMubWludFR4RmVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMubWludFR4RmVlID0gdGhpcy5nZXREZWZhdWx0TWludFR4RmVlKClcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLm1pbnRUeEZlZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGNyZWF0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICovXHJcbiAgZ2V0Q3JlYXRpb25UeEZlZSA9ICgpOiBCTiA9PiB7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMuY3JlYXRpb25UeEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aGlzLmNyZWF0aW9uVHhGZWUgPSB0aGlzLmdldERlZmF1bHRDcmVhdGlvblR4RmVlKClcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmNyZWF0aW9uVHhGZWVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIG1pbnQgZmVlIGZvciB0aGlzIGNoYWluLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGZlZSBUaGUgbWludCBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqL1xyXG4gIHNldE1pbnRUeEZlZSA9IChmZWU6IEJOKTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLm1pbnRUeEZlZSA9IGZlZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGZlZSBUaGUgY3JlYXRpb24gZmVlIGFtb3VudCB0byBzZXQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKi9cclxuICBzZXRDcmVhdGlvblR4RmVlID0gKGZlZTogQk4pOiB2b2lkID0+IHtcclxuICAgIHRoaXMuY3JlYXRpb25UeEZlZSA9IGZlZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyBhIHJlZmVyZW5jZSB0byB0aGUga2V5Y2hhaW4gZm9yIHRoaXMgY2xhc3MuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2Ugb2YgW1tLZXlDaGFpbl1dIGZvciB0aGlzIGNsYXNzXHJcbiAgICovXHJcbiAga2V5Q2hhaW4gPSAoKTogS2V5Q2hhaW4gPT4gdGhpcy5rZXljaGFpblxyXG5cclxuICAvKipcclxuICAgKiBAaWdub3JlXHJcbiAgICovXHJcbiAgbmV3S2V5Q2hhaW4gPSAoKTogS2V5Q2hhaW4gPT4ge1xyXG4gICAgLy8gd2FybmluZywgb3ZlcndyaXRlcyB0aGUgb2xkIGtleWNoYWluXHJcbiAgICBjb25zdCBhbGlhczogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxyXG4gICAgaWYgKGFsaWFzKSB7XHJcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBhbGlhcylcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCB0aGlzLmJsb2NrY2hhaW5JRClcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmtleWNoYWluXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIHR4IGlzIGEgZ29vc2UgZWdnIHRyYW5zYWN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHV0eCBBbiBVbnNpZ25lZFR4XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBib29sZWFuIHRydWUgaWYgcGFzc2VzIGdvb3NlIGVnZyB0ZXN0IGFuZCBmYWxzZSBpZiBmYWlscy5cclxuICAgKlxyXG4gICAqIEByZW1hcmtzXHJcbiAgICogQSBcIkdvb3NlIEVnZyBUcmFuc2FjdGlvblwiIGlzIHdoZW4gdGhlIGZlZSBmYXIgZXhjZWVkcyBhIHJlYXNvbmFibGUgYW1vdW50XHJcbiAgICovXHJcbiAgY2hlY2tHb29zZUVnZyA9IGFzeW5jIChcclxuICAgIHV0eDogVW5zaWduZWRUeCxcclxuICAgIG91dFRvdGFsOiBCTiA9IG5ldyBCTigwKVxyXG4gICk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xyXG4gICAgY29uc3QganVuZUFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0SlVORUFzc2V0SUQoKVxyXG4gICAgY29uc3Qgb3V0cHV0VG90YWw6IEJOID0gb3V0VG90YWwuZ3QobmV3IEJOKDApKVxyXG4gICAgICA/IG91dFRvdGFsXHJcbiAgICAgIDogdXR4LmdldE91dHB1dFRvdGFsKGp1bmVBc3NldElEKVxyXG4gICAgY29uc3QgZmVlOiBCTiA9IHV0eC5nZXRCdXJuKGp1bmVBc3NldElEKVxyXG4gICAgaWYgKGZlZS5sdGUoT05FSlVORS5tdWwobmV3IEJOKDEwKSkpIHx8IGZlZS5sdGUob3V0cHV0VG90YWwpKSB7XHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGJhbGFuY2Ugb2YgYSBwYXJ0aWN1bGFyIGFzc2V0IG9uIGEgYmxvY2tjaGFpbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHRvIHB1bGwgdGhlIGFzc2V0IGJhbGFuY2UgZnJvbVxyXG4gICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldElEIHRvIHB1bGwgdGhlIGJhbGFuY2UgZnJvbVxyXG4gICAqIEBwYXJhbSBpbmNsdWRlUGFydGlhbCBJZiBpbmNsdWRlUGFydGlhbD1mYWxzZSwgcmV0dXJucyBvbmx5IHRoZSBiYWxhbmNlIGhlbGQgc29sZWx5XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIHdpdGggdGhlIGJhbGFuY2Ugb2YgdGhlIGFzc2V0SUQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBvbiB0aGUgcHJvdmlkZWQgYWRkcmVzcyBmb3IgdGhlIGJsb2NrY2hhaW4uXHJcbiAgICovXHJcbiAgZ2V0QmFsYW5jZSA9IGFzeW5jIChcclxuICAgIGFkZHJlc3M6IHN0cmluZyxcclxuICAgIGFzc2V0SUQ6IHN0cmluZyxcclxuICAgIGluY2x1ZGVQYXJ0aWFsOiBib29sZWFuID0gZmFsc2VcclxuICApOiBQcm9taXNlPEdldEJhbGFuY2VSZXNwb25zZT4gPT4ge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBKVk1BUEkuZ2V0QmFsYW5jZTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIGNvbnN0IHBhcmFtczogR2V0QmFsYW5jZVBhcmFtcyA9IHtcclxuICAgICAgYWRkcmVzcyxcclxuICAgICAgYXNzZXRJRCxcclxuICAgICAgaW5jbHVkZVBhcnRpYWxcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp2bS5nZXRCYWxhbmNlXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGFuIGFkZHJlc3MgKGFuZCBhc3NvY2lhdGVkIHByaXZhdGUga2V5cykgb24gYSB1c2VyIG9uIGEgYmxvY2tjaGFpbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBOYW1lIG9mIHRoZSB1c2VyIHRvIGNyZWF0ZSB0aGUgYWRkcmVzcyB1bmRlclxyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBQYXNzd29yZCB0byB1bmxvY2sgdGhlIHVzZXIgYW5kIGVuY3J5cHQgdGhlIHByaXZhdGUga2V5XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGFkZHJlc3MgY3JlYXRlZCBieSB0aGUgdm0uXHJcbiAgICovXHJcbiAgY3JlYXRlQWRkcmVzcyA9IGFzeW5jIChcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXHJcbiAgICBwYXNzd29yZDogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlQWRkcmVzc1BhcmFtcyA9IHtcclxuICAgICAgdXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdm0uY3JlYXRlQWRkcmVzc1wiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBuZXcgZml4ZWQtY2FwLCBmdW5naWJsZSBhc3NldC4gQSBxdWFudGl0eSBvZiBpdCBpcyBjcmVhdGVkIGF0IGluaXRpYWxpemF0aW9uIGFuZCB0aGVyZSBubyBtb3JlIGlzIGV2ZXIgY3JlYXRlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEpVTkUpIGZvciBhc3NldCBjcmVhdGlvblxyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkSlVORSkgZm9yIGFzc2V0IGNyZWF0aW9uXHJcbiAgICogQHBhcmFtIG5hbWUgVGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBhc3NldFxyXG4gICAqIEBwYXJhbSBzeW1ib2wgT3B0aW9uYWwuIFRoZSBzaG9ydGhhbmQgc3ltYm9sIGZvciB0aGUgYXNzZXQuIEJldHdlZW4gMCBhbmQgNCBjaGFyYWN0ZXJzXHJcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBPcHRpb25hbC4gRGV0ZXJtaW5lcyBob3cgYmFsYW5jZXMgb2YgdGhpcyBhc3NldCBhcmUgZGlzcGxheWVkIGJ5IHVzZXIgaW50ZXJmYWNlcy4gRGVmYXVsdCBpcyAwXHJcbiAgICogQHBhcmFtIGluaXRpYWxIb2xkZXJzIEFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmluZyB0aGUgZmllbGQgXCJhZGRyZXNzXCIgYW5kIFwiYW1vdW50XCIgdG8gZXN0YWJsaXNoIHRoZSBnZW5lc2lzIHZhbHVlcyBmb3IgdGhlIG5ldyBhc3NldFxyXG4gICAqXHJcbiAgICogYGBganNcclxuICAgKiBFeGFtcGxlIGluaXRpYWxIb2xkZXJzOlxyXG4gICAqIFtcclxuICAgKiAgIHtcclxuICAgKiAgICAgXCJhZGRyZXNzXCI6IFwiWC1qdW5lMWtqMDZsaGd4ODRoMzlzbnNsamNleTN0cGMwNDZ6ZTY4bWVrM2c1XCIsXHJcbiAgICogICAgIFwiYW1vdW50XCI6IDEwMDAwXHJcbiAgICogICB9LFxyXG4gICAqICAge1xyXG4gICAqICAgICBcImFkZHJlc3NcIjogXCJYLWp1bmUxYW00dzZoZnJ2bWgzYWtkdXpranRocnRndHFhZmFsY2U2YW44Y3JcIixcclxuICAgKiAgICAgXCJhbW91bnRcIjogNTAwMDBcclxuICAgKiAgIH1cclxuICAgKiBdXHJcbiAgICogYGBgXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmFzZSA1OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIElEIG9mIHRoZSBuZXdseSBjcmVhdGVkIGFzc2V0LlxyXG4gICAqL1xyXG4gIGNyZWF0ZUZpeGVkQ2FwQXNzZXQgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIG5hbWU6IHN0cmluZyxcclxuICAgIHN5bWJvbDogc3RyaW5nLFxyXG4gICAgZGVub21pbmF0aW9uOiBudW1iZXIsXHJcbiAgICBpbml0aWFsSG9sZGVyczogb2JqZWN0W11cclxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBDcmVhdGVGaXhlZENhcEFzc2V0UGFyYW1zID0ge1xyXG4gICAgICBuYW1lLFxyXG4gICAgICBzeW1ib2wsXHJcbiAgICAgIGRlbm9taW5hdGlvbixcclxuICAgICAgdXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkLFxyXG4gICAgICBpbml0aWFsSG9sZGVyc1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwianZtLmNyZWF0ZUZpeGVkQ2FwQXNzZXRcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYXNzZXRJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGEgbmV3IHZhcmlhYmxlLWNhcCwgZnVuZ2libGUgYXNzZXQuIE5vIHVuaXRzIG9mIHRoZSBhc3NldCBleGlzdCBhdCBpbml0aWFsaXphdGlvbi4gTWludGVycyBjYW4gbWludCB1bml0cyBvZiB0aGlzIGFzc2V0IHVzaW5nIGNyZWF0ZU1pbnRUeCwgc2lnbk1pbnRUeCBhbmQgc2VuZE1pbnRUeC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEpVTkUpIGZvciBhc3NldCBjcmVhdGlvblxyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkSlVORSkgZm9yIGFzc2V0IGNyZWF0aW9uXHJcbiAgICogQHBhcmFtIG5hbWUgVGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBhc3NldFxyXG4gICAqIEBwYXJhbSBzeW1ib2wgT3B0aW9uYWwuIFRoZSBzaG9ydGhhbmQgc3ltYm9sIGZvciB0aGUgYXNzZXQgLS0gYmV0d2VlbiAwIGFuZCA0IGNoYXJhY3RlcnNcclxuICAgKiBAcGFyYW0gZGVub21pbmF0aW9uIE9wdGlvbmFsLiBEZXRlcm1pbmVzIGhvdyBiYWxhbmNlcyBvZiB0aGlzIGFzc2V0IGFyZSBkaXNwbGF5ZWQgYnkgdXNlciBpbnRlcmZhY2VzLiBEZWZhdWx0IGlzIDBcclxuICAgKiBAcGFyYW0gbWludGVyU2V0cyBpcyBhIGxpc3Qgd2hlcmUgZWFjaCBlbGVtZW50IHNwZWNpZmllcyB0aGF0IHRocmVzaG9sZCBvZiB0aGUgYWRkcmVzc2VzIGluIG1pbnRlcnMgbWF5IHRvZ2V0aGVyIG1pbnQgbW9yZSBvZiB0aGUgYXNzZXQgYnkgc2lnbmluZyBhIG1pbnRpbmcgdHJhbnNhY3Rpb25cclxuICAgKlxyXG4gICAqIGBgYGpzXHJcbiAgICogRXhhbXBsZSBtaW50ZXJTZXRzOlxyXG4gICAqIFtcclxuICAgKiAgICB7XHJcbiAgICogICAgICBcIm1pbnRlcnNcIjpbXHJcbiAgICogICAgICAgIFwiWC1qdW5lMWFtNHc2aGZydm1oM2FrZHV6a2p0aHJ0Z3RxYWZhbGNlNmFuOGNyXCJcclxuICAgKiAgICAgIF0sXHJcbiAgICogICAgICBcInRocmVzaG9sZFwiOiAxXHJcbiAgICogICAgIH0sXHJcbiAgICogICAgIHtcclxuICAgKiAgICAgIFwibWludGVyc1wiOiBbXHJcbiAgICogICAgICAgIFwiWC1qdW5lMWFtNHc2aGZydm1oM2FrZHV6a2p0aHJ0Z3RxYWZhbGNlNmFuOGNyXCIsXHJcbiAgICogICAgICAgIFwiWC1qdW5lMWtqMDZsaGd4ODRoMzlzbnNsamNleTN0cGMwNDZ6ZTY4bWVrM2c1XCIsXHJcbiAgICogICAgICAgIFwiWC1qdW5lMXllbGwzZTRubG4wbTM5Y2ZwZGhncXByc2Q4N2praDRxbmFra2x4XCJcclxuICAgKiAgICAgIF0sXHJcbiAgICogICAgICBcInRocmVzaG9sZFwiOiAyXHJcbiAgICogICAgIH1cclxuICAgKiBdXHJcbiAgICogYGBgXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmFzZSA1OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIElEIG9mIHRoZSBuZXdseSBjcmVhdGVkIGFzc2V0LlxyXG4gICAqL1xyXG4gIGNyZWF0ZVZhcmlhYmxlQ2FwQXNzZXQgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIG5hbWU6IHN0cmluZyxcclxuICAgIHN5bWJvbDogc3RyaW5nLFxyXG4gICAgZGVub21pbmF0aW9uOiBudW1iZXIsXHJcbiAgICBtaW50ZXJTZXRzOiBvYmplY3RbXVxyXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IENyZWF0ZVZhcmlhYmxlQ2FwQXNzZXRQYXJhbXMgPSB7XHJcbiAgICAgIG5hbWUsXHJcbiAgICAgIHN5bWJvbCxcclxuICAgICAgZGVub21pbmF0aW9uLFxyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIG1pbnRlclNldHNcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp2bS5jcmVhdGVWYXJpYWJsZUNhcEFzc2V0XCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBmYW1pbHkgb2YgTkZUIEFzc2V0LiBObyB1bml0cyBvZiB0aGUgYXNzZXQgZXhpc3QgYXQgaW5pdGlhbGl6YXRpb24uIE1pbnRlcnMgY2FuIG1pbnQgdW5pdHMgb2YgdGhpcyBhc3NldCB1c2luZyBjcmVhdGVNaW50VHgsIHNpZ25NaW50VHggYW5kIHNlbmRNaW50VHguXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRKVU5FKSBmb3IgYXNzZXQgY3JlYXRpb25cclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIGZvciB0aGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEpVTkUpIGZvciBhc3NldCBjcmVhdGlvblxyXG4gICAqIEBwYXJhbSBmcm9tIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBhZGRyZXNzZXMgbWFuYWdlZCBieSB0aGUgbm9kZSdzIGtleXN0b3JlIGZvciB0aGlzIGJsb2NrY2hhaW4gd2hpY2ggd2lsbCBmdW5kIHRoaXMgdHJhbnNhY3Rpb25cclxuICAgKiBAcGFyYW0gY2hhbmdlQWRkciBPcHRpb25hbC4gQW4gYWRkcmVzcyB0byBzZW5kIHRoZSBjaGFuZ2VcclxuICAgKiBAcGFyYW0gbmFtZSBUaGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIGFzc2V0XHJcbiAgICogQHBhcmFtIHN5bWJvbCBPcHRpb25hbC4gVGhlIHNob3J0aGFuZCBzeW1ib2wgZm9yIHRoZSBhc3NldCAtLSBiZXR3ZWVuIDAgYW5kIDQgY2hhcmFjdGVyc1xyXG4gICAqIEBwYXJhbSBtaW50ZXJTZXRzIGlzIGEgbGlzdCB3aGVyZSBlYWNoIGVsZW1lbnQgc3BlY2lmaWVzIHRoYXQgdGhyZXNob2xkIG9mIHRoZSBhZGRyZXNzZXMgaW4gbWludGVycyBtYXkgdG9nZXRoZXIgbWludCBtb3JlIG9mIHRoZSBhc3NldCBieSBzaWduaW5nIGEgbWludGluZyB0cmFuc2FjdGlvblxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGJhc2UgNTggc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBJRCBvZiB0aGUgbmV3bHkgY3JlYXRlZCBhc3NldC5cclxuICAgKi9cclxuICBjcmVhdGVORlRBc3NldCA9IGFzeW5jIChcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXHJcbiAgICBwYXNzd29yZDogc3RyaW5nLFxyXG4gICAgZnJvbTogc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcclxuICAgIGNoYW5nZUFkZHI6IHN0cmluZyxcclxuICAgIG5hbWU6IHN0cmluZyxcclxuICAgIHN5bWJvbDogc3RyaW5nLFxyXG4gICAgbWludGVyU2V0OiBJTWludGVyU2V0XHJcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlTkZUQXNzZXRQYXJhbXMgPSB7XHJcbiAgICAgIHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZCxcclxuICAgICAgbmFtZSxcclxuICAgICAgc3ltYm9sLFxyXG4gICAgICBtaW50ZXJTZXRcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiY3JlYXRlTkZUQXNzZXRcIlxyXG4gICAgZnJvbSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb20sIGNhbGxlcilcclxuICAgIGlmICh0eXBlb2YgZnJvbSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBwYXJhbXNbXCJmcm9tXCJdID0gZnJvbVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkciAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGNoYW5nZUFkZHIpID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxyXG4gICAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5jcmVhdGVORlRBc3NldDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXHJcbiAgICAgICAgKVxyXG4gICAgICB9XHJcbiAgICAgIHBhcmFtc1tcImNoYW5nZUFkZHJcIl0gPSBjaGFuZ2VBZGRyXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwianZtLmNyZWF0ZU5GVEFzc2V0XCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiB0byBtaW50IG1vcmUgb2YgYW4gYXNzZXQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSB1bml0cyBvZiB0aGUgYXNzZXQgdG8gbWludFxyXG4gICAqIEBwYXJhbSBhc3NldElEIFRoZSBJRCBvZiB0aGUgYXNzZXQgdG8gbWludFxyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyB0byBhc3NpZ24gdGhlIHVuaXRzIG9mIHRoZSBtaW50ZWQgYXNzZXRcclxuICAgKiBAcGFyYW0gbWludGVycyBBZGRyZXNzZXMgb2YgdGhlIG1pbnRlcnMgcmVzcG9uc2libGUgZm9yIHNpZ25pbmcgdGhlIHRyYW5zYWN0aW9uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmFzZSA1OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uLlxyXG4gICAqL1xyXG4gIG1pbnQgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIGFtb3VudDogbnVtYmVyIHwgQk4sXHJcbiAgICBhc3NldElEOiBCdWZmZXIgfCBzdHJpbmcsXHJcbiAgICB0bzogc3RyaW5nLFxyXG4gICAgbWludGVyczogc3RyaW5nW11cclxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgbGV0IGFzc2V0OiBzdHJpbmdcclxuICAgIGxldCBhbW50OiBCTlxyXG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYXNzZXQgPSBhc3NldElEXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIGFtb3VudCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICBhbW50ID0gbmV3IEJOKGFtb3VudClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFtbnQgPSBhbW91bnRcclxuICAgIH1cclxuICAgIGNvbnN0IHBhcmFtczogTWludFBhcmFtcyA9IHtcclxuICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgIGFtb3VudDogYW1udCxcclxuICAgICAgYXNzZXRJRDogYXNzZXQsXHJcbiAgICAgIHRvLFxyXG4gICAgICBtaW50ZXJzXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdm0ubWludFwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNaW50IG5vbi1mdW5naWJsZSB0b2tlbnMgd2hpY2ggd2VyZSBjcmVhdGVkIHdpdGggSlZNQVBJLmNyZWF0ZU5GVEFzc2V0XHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRKVU5FKSBmb3IgYXNzZXQgY3JlYXRpb25cclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIGZvciB0aGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEpVTkUpIGZvciBhc3NldCBjcmVhdGlvblxyXG4gICAqIEBwYXJhbSBmcm9tIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBhZGRyZXNzZXMgbWFuYWdlZCBieSB0aGUgbm9kZSdzIGtleXN0b3JlIGZvciB0aGlzIGJsb2NrY2hhaW4gd2hpY2ggd2lsbCBmdW5kIHRoaXMgdHJhbnNhY3Rpb25cclxuICAgKiBAcGFyYW0gY2hhbmdlQWRkciBPcHRpb25hbC4gQW4gYWRkcmVzcyB0byBzZW5kIHRoZSBjaGFuZ2VcclxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXQgaWQgd2hpY2ggaXMgYmVpbmcgc2VudFxyXG4gICAqIEBwYXJhbSB0byBBZGRyZXNzIG9uIFgtQ2hhaW4gb2YgdGhlIGFjY291bnQgdG8gd2hpY2ggdGhpcyBORlQgaXMgYmVpbmcgc2VudFxyXG4gICAqIEBwYXJhbSBlbmNvZGluZyBPcHRpb25hbC4gIGlzIHRoZSBlbmNvZGluZyBmb3JtYXQgdG8gdXNlIGZvciB0aGUgcGF5bG9hZCBhcmd1bWVudC4gQ2FuIGJlIGVpdGhlciBcImNiNThcIiBvciBcImhleFwiLiBEZWZhdWx0cyB0byBcImhleFwiLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgSUQgb2YgdGhlIHRyYW5zYWN0aW9uXHJcbiAgICovXHJcbiAgbWludE5GVCA9IGFzeW5jIChcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXHJcbiAgICBwYXNzd29yZDogc3RyaW5nLFxyXG4gICAgZnJvbTogc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcclxuICAgIGNoYW5nZUFkZHI6IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuICAgIHBheWxvYWQ6IHN0cmluZyxcclxuICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlcixcclxuICAgIHRvOiBzdHJpbmcsXHJcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIlxyXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xyXG5cclxuICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3ModG8pID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEpWTUFQSS5taW50TkZUOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYXNzZXQgPSBhc3NldElEXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGFyYW1zOiBNaW50TkZUUGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIGFzc2V0SUQ6IGFzc2V0LFxyXG4gICAgICBwYXlsb2FkLFxyXG4gICAgICB0byxcclxuICAgICAgZW5jb2RpbmdcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwibWludE5GVFwiXHJcbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgY2FsbGVyKVxyXG4gICAgaWYgKHR5cGVvZiBmcm9tICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHBhcmFtc1tcImZyb21cIl0gPSBmcm9tXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoY2hhbmdlQWRkcikgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEpWTUFQSS5taW50TkZUOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpXHJcbiAgICAgIH1cclxuICAgICAgcGFyYW1zW1wiY2hhbmdlQWRkclwiXSA9IGNoYW5nZUFkZHJcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdm0ubWludE5GVFwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZW5kIE5GVCBmcm9tIG9uZSBhY2NvdW50IHRvIGFub3RoZXIgb24gWC1DaGFpblxyXG4gICAqXHJcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkSlVORSkgZm9yIGFzc2V0IGNyZWF0aW9uXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBmb3IgdGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRKVU5FKSBmb3IgYXNzZXQgY3JlYXRpb25cclxuICAgKiBAcGFyYW0gZnJvbSBPcHRpb25hbC4gQW4gYXJyYXkgb2YgYWRkcmVzc2VzIG1hbmFnZWQgYnkgdGhlIG5vZGUncyBrZXlzdG9yZSBmb3IgdGhpcyBibG9ja2NoYWluIHdoaWNoIHdpbGwgZnVuZCB0aGlzIHRyYW5zYWN0aW9uXHJcbiAgICogQHBhcmFtIGNoYW5nZUFkZHIgT3B0aW9uYWwuIEFuIGFkZHJlc3MgdG8gc2VuZCB0aGUgY2hhbmdlXHJcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0IGlkIHdoaWNoIGlzIGJlaW5nIHNlbnRcclxuICAgKiBAcGFyYW0gZ3JvdXBJRCBUaGUgZ3JvdXAgdGhpcyBORlQgaXMgaXNzdWVkIHRvLlxyXG4gICAqIEBwYXJhbSB0byBBZGRyZXNzIG9uIFgtQ2hhaW4gb2YgdGhlIGFjY291bnQgdG8gd2hpY2ggdGhpcyBORlQgaXMgYmVpbmcgc2VudFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgSUQgb2YgdGhlIHRyYW5zYWN0aW9uXHJcbiAgICovXHJcbiAgc2VuZE5GVCA9IGFzeW5jIChcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXHJcbiAgICBwYXNzd29yZDogc3RyaW5nLFxyXG4gICAgZnJvbTogc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcclxuICAgIGNoYW5nZUFkZHI6IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlcixcclxuICAgIGdyb3VwSUQ6IG51bWJlcixcclxuICAgIHRvOiBzdHJpbmdcclxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgbGV0IGFzc2V0OiBzdHJpbmdcclxuXHJcbiAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKHRvKSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBKVk1BUEkuc2VuZE5GVDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhcmFtczogU2VuZE5GVFBhcmFtcyA9IHtcclxuICAgICAgdXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkLFxyXG4gICAgICBhc3NldElEOiBhc3NldCxcclxuICAgICAgZ3JvdXBJRCxcclxuICAgICAgdG9cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwic2VuZE5GVFwiXHJcbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgY2FsbGVyKVxyXG4gICAgaWYgKHR5cGVvZiBmcm9tICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHBhcmFtc1tcImZyb21cIl0gPSBmcm9tXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoY2hhbmdlQWRkcikgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEpWTUFQSS5zZW5kTkZUOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpXHJcbiAgICAgIH1cclxuICAgICAgcGFyYW1zW1wiY2hhbmdlQWRkclwiXSA9IGNoYW5nZUFkZHJcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdm0uc2VuZE5GVFwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHBvcnRzIHRoZSBwcml2YXRlIGtleSBmb3IgYW4gYWRkcmVzcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB3aXRoIHRoZSBwcml2YXRlIGtleVxyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdXNlZCB0byBkZWNyeXB0IHRoZSBwcml2YXRlIGtleVxyXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHdob3NlIHByaXZhdGUga2V5IHNob3VsZCBiZSBleHBvcnRlZFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBkZWNyeXB0ZWQgcHJpdmF0ZSBrZXkgYXMgc3RvcmUgaW4gdGhlIGRhdGFiYXNlXHJcbiAgICovXHJcbiAgZXhwb3J0S2V5ID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXHJcbiAgICBhZGRyZXNzOiBzdHJpbmdcclxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBKVk1BUEkuZXhwb3J0S2V5OiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpXHJcbiAgICB9XHJcbiAgICBjb25zdCBwYXJhbXM6IEV4cG9ydEtleVBhcmFtcyA9IHtcclxuICAgICAgdXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkLFxyXG4gICAgICBhZGRyZXNzXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdm0uZXhwb3J0S2V5XCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnByaXZhdGVLZXlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEltcG9ydHMgYSBwcml2YXRlIGtleSBpbnRvIHRoZSBub2RlJ3Mga2V5c3RvcmUgdW5kZXIgYW4gdXNlciBhbmQgZm9yIGEgYmxvY2tjaGFpbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB0byBzdG9yZSB0aGUgcHJpdmF0ZSBrZXlcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHRoYXQgdW5sb2NrcyB0aGUgdXNlclxyXG4gICAqIEBwYXJhbSBwcml2YXRlS2V5IEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcHJpdmF0ZSBrZXkgaW4gdGhlIHZtJ3MgZm9ybWF0XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgYWRkcmVzcyBmb3IgdGhlIGltcG9ydGVkIHByaXZhdGUga2V5LlxyXG4gICAqL1xyXG4gIGltcG9ydEtleSA9IGFzeW5jIChcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXHJcbiAgICBwYXNzd29yZDogc3RyaW5nLFxyXG4gICAgcHJpdmF0ZUtleTogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0S2V5UGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIHByaXZhdGVLZXlcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp2bS5pbXBvcnRLZXlcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VuZCBBTlQgKEp1bmVvIE5hdGl2ZSBUb2tlbikgYXNzZXRzIGluY2x1ZGluZyBKVU5FIGZyb20gdGhlIFgtQ2hhaW4gdG8gYW4gYWNjb3VudCBvbiB0aGUgUC1DaGFpbiBvciBDLUNoYWluLlxyXG4gICAqXHJcbiAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgeW91IG11c3QgY2FsbCB0aGUgUC1DaGFpbidzIGBpbXBvcnRgIG9yIHRoZSBDLUNoYWlu4oCZcyBgaW1wb3J0YCBtZXRob2QgdG8gY29tcGxldGUgdGhlIHRyYW5zZmVyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIFAtQ2hhaW4gb3IgQy1DaGFpbiBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxyXG4gICAqIEBwYXJhbSB0byBUaGUgYWNjb3VudCBvbiB0aGUgUC1DaGFpbiBvciBDLUNoYWluIHRvIHNlbmQgdGhlIGFzc2V0IHRvLlxyXG4gICAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIGFzc2V0IHRvIGV4cG9ydCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0IGlkIHdoaWNoIGlzIGJlaW5nIHNlbnRcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFN0cmluZyByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uIGlkXHJcbiAgICovXHJcbiAgZXhwb3J0ID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXHJcbiAgICB0bzogc3RyaW5nLFxyXG4gICAgYW1vdW50OiBCTixcclxuICAgIGFzc2V0SUQ6IHN0cmluZ1xyXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEV4cG9ydFBhcmFtcyA9IHtcclxuICAgICAgdXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkLFxyXG4gICAgICB0byxcclxuICAgICAgYW1vdW50OiBhbW91bnQsXHJcbiAgICAgIGFzc2V0SURcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp2bS5leHBvcnRcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VuZCBBTlQgKEp1bmVvIE5hdGl2ZSBUb2tlbikgYXNzZXRzIGluY2x1ZGluZyBKVU5FIGZyb20gYW4gYWNjb3VudCBvbiB0aGUgUC1DaGFpbiBvciBDLUNoYWluIHRvIGFuIGFkZHJlc3Mgb24gdGhlIFgtQ2hhaW4uIFRoaXMgdHJhbnNhY3Rpb25cclxuICAgKiBtdXN0IGJlIHNpZ25lZCB3aXRoIHRoZSBrZXkgb2YgdGhlIGFjY291bnQgdGhhdCB0aGUgYXNzZXQgaXMgc2VudCBmcm9tIGFuZCB3aGljaCBwYXlzXHJcbiAgICogdGhlIHRyYW5zYWN0aW9uIGZlZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0aGUgYXNzZXQgaXMgc2VudCB0by5cclxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluSUQgd2hlcmUgdGhlIGZ1bmRzIGFyZSBjb21pbmcgZnJvbS4gRXg6IFwiQ1wiXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyBmb3IgdGhlIHRyYW5zYWN0aW9uLCB3aGljaCBzaG91bGQgYmUgc2VudCB0byB0aGUgbmV0d29ya1xyXG4gICAqIGJ5IGNhbGxpbmcgaXNzdWVUeC5cclxuICAgKi9cclxuICBpbXBvcnQgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIHRvOiBzdHJpbmcsXHJcbiAgICBzb3VyY2VDaGFpbjogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0UGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIHRvLFxyXG4gICAgICBzb3VyY2VDaGFpblxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwianZtLmltcG9ydFwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMaXN0cyBhbGwgdGhlIGFkZHJlc3NlcyB1bmRlciBhIHVzZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgdG8gbGlzdCBhZGRyZXNzZXNcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSB1c2VyIHRvIGxpc3QgdGhlIGFkZHJlc3Nlc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBvZiBhbiBhcnJheSBvZiBhZGRyZXNzIHN0cmluZ3MgaW4gdGhlIGZvcm1hdCBzcGVjaWZpZWQgYnkgdGhlIGJsb2NrY2hhaW4uXHJcbiAgICovXHJcbiAgbGlzdEFkZHJlc3NlcyA9IGFzeW5jIChcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXHJcbiAgICBwYXNzd29yZDogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBMaXN0QWRkcmVzc2VzUGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmRcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp2bS5saXN0QWRkcmVzc2VzXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3Nlc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0cmlldmVzIGFsbCBhc3NldHMgZm9yIGFuIGFkZHJlc3Mgb24gYSBzZXJ2ZXIgYW5kIHRoZWlyIGFzc29jaWF0ZWQgYmFsYW5jZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB0byBnZXQgYSBsaXN0IG9mIGFzc2V0c1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBvZiBhbiBvYmplY3QgbWFwcGluZyBhc3NldElEIHN0cmluZ3Mgd2l0aCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBiYWxhbmNlIGZvciB0aGUgYWRkcmVzcyBvbiB0aGUgYmxvY2tjaGFpbi5cclxuICAgKi9cclxuICBnZXRBbGxCYWxhbmNlcyA9IGFzeW5jIChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPG9iamVjdFtdPiA9PiB7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3MpID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5nZXRBbGxCYWxhbmNlczogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIGNvbnN0IHBhcmFtczogR2V0QWxsQmFsYW5jZXNQYXJhbXMgPSB7XHJcbiAgICAgIGFkZHJlc3NcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp2bS5nZXRBbGxCYWxhbmNlc1wiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5iYWxhbmNlc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0cmlldmVzIGFuIGFzc2V0cyBuYW1lIGFuZCBzeW1ib2wuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYXNzZXRJRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhbiBiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBBc3NldElEIG9yIGl0cyBhbGlhcy5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIG9iamVjdCB3aXRoIGtleXMgXCJuYW1lXCIgYW5kIFwic3ltYm9sXCIuXHJcbiAgICovXHJcbiAgZ2V0QXNzZXREZXNjcmlwdGlvbiA9IGFzeW5jIChcclxuICAgIGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZ1xyXG4gICk6IFByb21pc2U8R2V0QXNzZXREZXNjcmlwdGlvblJlc3BvbnNlPiA9PiB7XHJcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xyXG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYXNzZXQgPSBhc3NldElEXHJcbiAgICB9XHJcbiAgICBjb25zdCBwYXJhbXM6IEdldEFzc2V0RGVzY3JpcHRpb25QYXJhbXMgPSB7XHJcbiAgICAgIGFzc2V0SUQ6IGFzc2V0XHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdm0uZ2V0QXNzZXREZXNjcmlwdGlvblwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5hbWU6IHJlc3BvbnNlLmRhdGEucmVzdWx0Lm5hbWUsXHJcbiAgICAgIHN5bWJvbDogcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3ltYm9sLFxyXG4gICAgICBhc3NldElEOiBiaW50b29scy5jYjU4RGVjb2RlKHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SUQpLFxyXG4gICAgICBkZW5vbWluYXRpb246IHBhcnNlSW50KHJlc3BvbnNlLmRhdGEucmVzdWx0LmRlbm9taW5hdGlvbiwgMTApXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB0cmFuc2FjdGlvbiBkYXRhIG9mIGEgcHJvdmlkZWQgdHJhbnNhY3Rpb24gSUQgYnkgY2FsbGluZyB0aGUgbm9kZSdzIGBnZXRUeGAgbWV0aG9kLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHR4SUQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcclxuICAgKiBAcGFyYW0gZW5jb2Rpbmcgc2V0cyB0aGUgZm9ybWF0IG9mIHRoZSByZXR1cm5lZCB0cmFuc2FjdGlvbi4gQ2FuIGJlLCBcImNiNThcIiwgXCJoZXhcIiBvciBcImpzb25cIi4gRGVmYXVsdHMgdG8gXCJjYjU4XCIuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgb3Igb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGJ5dGVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlXHJcbiAgICovXHJcbiAgZ2V0VHggPSBhc3luYyAoXHJcbiAgICB0eElEOiBzdHJpbmcsXHJcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIlxyXG4gICk6IFByb21pc2U8c3RyaW5nIHwgb2JqZWN0PiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEdldFR4UGFyYW1zID0ge1xyXG4gICAgICB0eElELFxyXG4gICAgICBlbmNvZGluZ1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwianZtLmdldFR4XCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzdGF0dXMgb2YgYSBwcm92aWRlZCB0cmFuc2FjdGlvbiBJRCBieSBjYWxsaW5nIHRoZSBub2RlJ3MgYGdldFR4U3RhdHVzYCBtZXRob2QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdHhJRCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHN0YXR1cyByZXRyaWV2ZWQgZnJvbSB0aGUgbm9kZVxyXG4gICAqL1xyXG4gIGdldFR4U3RhdHVzID0gYXN5bmMgKHR4SUQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEdldFR4U3RhdHVzUGFyYW1zID0ge1xyXG4gICAgICB0eElEXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdm0uZ2V0VHhTdGF0dXNcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3RhdHVzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXRyaWV2ZXMgdGhlIFVUWE9zIHJlbGF0ZWQgdG8gdGhlIGFkZHJlc3NlcyBwcm92aWRlZCBmcm9tIHRoZSBub2RlJ3MgYGdldFVUWE9zYCBtZXRob2QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyBjYjU4IHN0cmluZ3Mgb3IgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9c1xyXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBBIHN0cmluZyBmb3IgdGhlIGNoYWluIHRvIGxvb2sgZm9yIHRoZSBVVFhPJ3MuIERlZmF1bHQgaXMgdG8gdXNlIHRoaXMgY2hhaW4sIGJ1dCBpZiBleHBvcnRlZCBVVFhPcyBleGlzdCBmcm9tIG90aGVyIGNoYWlucywgdGhpcyBjYW4gdXNlZCB0byBwdWxsIHRoZW0gaW5zdGVhZC5cclxuICAgKiBAcGFyYW0gbGltaXQgT3B0aW9uYWwuIFJldHVybnMgYXQgbW9zdCBbbGltaXRdIGFkZHJlc3Nlcy4gSWYgW2xpbWl0XSA9PSAwIG9yID4gW21heFVUWE9zVG9GZXRjaF0sIGZldGNoZXMgdXAgdG8gW21heFVUWE9zVG9GZXRjaF0uXHJcbiAgICogQHBhcmFtIHN0YXJ0SW5kZXggT3B0aW9uYWwuIFtTdGFydEluZGV4XSBkZWZpbmVzIHdoZXJlIHRvIHN0YXJ0IGZldGNoaW5nIFVUWE9zIChmb3IgcGFnaW5hdGlvbi4pXHJcbiAgICogVVRYT3MgZmV0Y2hlZCBhcmUgZnJvbSBhZGRyZXNzZXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LkFkZHJlc3NdXHJcbiAgICogRm9yIGFkZHJlc3MgW1N0YXJ0SW5kZXguQWRkcmVzc10sIG9ubHkgVVRYT3Mgd2l0aCBJRHMgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LlV0eG9dIHdpbGwgYmUgcmV0dXJuZWQuXHJcbiAgICogQHBhcmFtIHBlcnNpc3RPcHRzIE9wdGlvbnMgYXZhaWxhYmxlIHRvIHBlcnNpc3QgdGhlc2UgVVRYT3MgaW4gbG9jYWwgc3RvcmFnZVxyXG4gICAqXHJcbiAgICogQHJlbWFya3NcclxuICAgKiBwZXJzaXN0T3B0cyBpcyBvcHRpb25hbCBhbmQgbXVzdCBiZSBvZiB0eXBlIFtbUGVyc2lzdGFuY2VPcHRpb25zXV1cclxuICAgKlxyXG4gICAqL1xyXG4gIGdldFVUWE9zID0gYXN5bmMgKFxyXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSB8IHN0cmluZyxcclxuICAgIHNvdXJjZUNoYWluOiBzdHJpbmcgPSB1bmRlZmluZWQsXHJcbiAgICBsaW1pdDogbnVtYmVyID0gMCxcclxuICAgIHN0YXJ0SW5kZXg6IHsgYWRkcmVzczogc3RyaW5nOyB1dHhvOiBzdHJpbmcgfSA9IHVuZGVmaW5lZCxcclxuICAgIHBlcnNpc3RPcHRzOiBQZXJzaXN0YW5jZU9wdGlvbnMgPSB1bmRlZmluZWQsXHJcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIlxyXG4gICk6IFByb21pc2U8R2V0VVRYT3NSZXNwb25zZT4gPT4ge1xyXG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzZXMgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgYWRkcmVzc2VzID0gW2FkZHJlc3Nlc11cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYXJhbXM6IEdldFVUWE9zUGFyYW1zID0ge1xyXG4gICAgICBhZGRyZXNzZXM6IGFkZHJlc3NlcyxcclxuICAgICAgbGltaXQsXHJcbiAgICAgIGVuY29kaW5nXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHN0YXJ0SW5kZXggIT09IFwidW5kZWZpbmVkXCIgJiYgc3RhcnRJbmRleCkge1xyXG4gICAgICBwYXJhbXMuc3RhcnRJbmRleCA9IHN0YXJ0SW5kZXhcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIHNvdXJjZUNoYWluICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHBhcmFtcy5zb3VyY2VDaGFpbiA9IHNvdXJjZUNoYWluXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwianZtLmdldFVUWE9zXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgY29uc3QgdXR4b3M6IFVUWE9TZXQgPSBuZXcgVVRYT1NldCgpXHJcbiAgICBsZXQgZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zXHJcbiAgICBpZiAocGVyc2lzdE9wdHMgJiYgdHlwZW9mIHBlcnNpc3RPcHRzID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgIGlmICh0aGlzLmRiLmhhcyhwZXJzaXN0T3B0cy5nZXROYW1lKCkpKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZkFycmF5OiBzdHJpbmdbXSA9IHRoaXMuZGIuZ2V0KHBlcnNpc3RPcHRzLmdldE5hbWUoKSlcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmQXJyYXkpKSB7XHJcbiAgICAgICAgICB1dHhvcy5hZGRBcnJheShkYXRhKVxyXG4gICAgICAgICAgY29uc3QgdXR4b1NldDogVVRYT1NldCA9IG5ldyBVVFhPU2V0KClcclxuICAgICAgICAgIHV0eG9TZXQuYWRkQXJyYXkoc2VsZkFycmF5KVxyXG4gICAgICAgICAgdXR4b1NldC5tZXJnZUJ5UnVsZSh1dHhvcywgcGVyc2lzdE9wdHMuZ2V0TWVyZ2VSdWxlKCkpXHJcbiAgICAgICAgICBkYXRhID0gdXR4b1NldC5nZXRBbGxVVFhPU3RyaW5ncygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuZGIuc2V0KHBlcnNpc3RPcHRzLmdldE5hbWUoKSwgZGF0YSwgcGVyc2lzdE9wdHMuZ2V0T3ZlcndyaXRlKCkpXHJcbiAgICB9XHJcbiAgICBpZiAoZGF0YS5sZW5ndGggPiAwICYmIGRhdGFbMF0uc3Vic3RyaW5nKDAsIDIpID09PSBcIjB4XCIpIHtcclxuICAgICAgY29uc3QgY2I1OFN0cnM6IHN0cmluZ1tdID0gW11cclxuICAgICAgZGF0YS5mb3JFYWNoKChzdHI6IHN0cmluZyk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNiNThTdHJzLnB1c2goYmludG9vbHMuY2I1OEVuY29kZShuZXcgQnVmZmVyKHN0ci5zbGljZSgyKSwgXCJoZXhcIikpKVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgdXR4b3MuYWRkQXJyYXkoY2I1OFN0cnMsIGZhbHNlKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdXR4b3MuYWRkQXJyYXkoZGF0YSwgZmFsc2UpXHJcbiAgICB9XHJcbiAgICByZXNwb25zZS5kYXRhLnJlc3VsdC51dHhvcyA9IHV0eG9zXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxyXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXHJcbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IG9mIEFzc2V0SUQgdG8gYmUgc3BlbnQgaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXHJcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0SUQgb2YgdGhlIHZhbHVlIGJlaW5nIHNlbnRcclxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xyXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxyXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xyXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcclxuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbQmFzZVR4XV0uXHJcbiAgICpcclxuICAgKiBAcmVtYXJrc1xyXG4gICAqIFRoaXMgaGVscGVyIGV4aXN0cyBiZWNhdXNlIHRoZSBlbmRwb2ludCBBUEkgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IHBvaW50IG9mIGVudHJ5IGZvciBtb3N0IGZ1bmN0aW9uYWxpdHkuXHJcbiAgICovXHJcbiAgYnVpbGRCYXNlVHggPSBhc3luYyAoXHJcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxyXG4gICAgYW1vdW50OiBCTixcclxuICAgIGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxyXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXHJcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXHJcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcclxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcclxuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZEJhc2VUeFwiXHJcbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheSh0b0FkZHJlc3NlcywgY2FsbGVyKS5tYXAoXHJcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXHJcbiAgICApXHJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxyXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxyXG4gICAgKVxyXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXHJcbiAgICAgIGNhbGxlclxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcblxyXG4gICAgaWYgKHR5cGVvZiBhc3NldElEID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIGFzc2V0SUQgPSBiaW50b29scy5jYjU4RGVjb2RlKGFzc2V0SUQpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xyXG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxyXG4gICAgY29uc3QgYmxvY2tjaGFpbklEQnVmOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxyXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKVxyXG4gICAgY29uc3QgZmVlQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRKVU5FQXNzZXRJRCgpXHJcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkQmFzZVR4KFxyXG4gICAgICBuZXR3b3JrSUQsXHJcbiAgICAgIGJsb2NrY2hhaW5JREJ1ZixcclxuICAgICAgYW1vdW50LFxyXG4gICAgICBhc3NldElELFxyXG4gICAgICB0byxcclxuICAgICAgZnJvbSxcclxuICAgICAgY2hhbmdlLFxyXG4gICAgICBmZWUsXHJcbiAgICAgIGZlZUFzc2V0SUQsXHJcbiAgICAgIG1lbW8sXHJcbiAgICAgIGFzT2YsXHJcbiAgICAgIGxvY2t0aW1lLFxyXG4gICAgICB0aHJlc2hvbGRcclxuICAgIClcclxuXHJcbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gSlZNQVBJLmJ1aWxkQmFzZVR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxyXG4gICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgTkZUIFRyYW5zZmVyLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxyXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvc2V0ICBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxyXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIE5GVFxyXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBORlQgZnJvbSB0aGUgdXR4b0lEIHByb3ZpZGVkXHJcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXHJcbiAgICogQHBhcmFtIHV0eG9pZCBBIGJhc2U1OCB1dHhvSUQgb3IgYW4gYXJyYXkgb2YgYmFzZTU4IHV0eG9JRHMgZm9yIHRoZSBuZnRzIHRoaXMgdHJhbnNhY3Rpb24gaXMgc2VuZGluZ1xyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xyXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcclxuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbTkZUVHJhbnNmZXJUeF1dLlxyXG4gICAqXHJcbiAgICogQHJlbWFya3NcclxuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxyXG4gICAqL1xyXG4gIGJ1aWxkTkZUVHJhbnNmZXJUeCA9IGFzeW5jIChcclxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXHJcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICB1dHhvaWQ6IHN0cmluZyB8IHN0cmluZ1tdLFxyXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcclxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcclxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxyXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xyXG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkTkZUVHJhbnNmZXJUeFwiXHJcbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheSh0b0FkZHJlc3NlcywgY2FsbGVyKS5tYXAoXHJcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXHJcbiAgICApXHJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxyXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxyXG4gICAgKVxyXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXHJcbiAgICAgIGNhbGxlclxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcblxyXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xyXG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcclxuICAgIH1cclxuICAgIGNvbnN0IGp1bmVBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEpVTkVBc3NldElEKClcclxuXHJcbiAgICBsZXQgdXR4b2lkQXJyYXk6IHN0cmluZ1tdID0gW11cclxuICAgIGlmICh0eXBlb2YgdXR4b2lkID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHV0eG9pZEFycmF5ID0gW3V0eG9pZF1cclxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh1dHhvaWQpKSB7XHJcbiAgICAgIHV0eG9pZEFycmF5ID0gdXR4b2lkXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZE5GVFRyYW5zZmVyVHgoXHJcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcclxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXHJcbiAgICAgIHRvLFxyXG4gICAgICBmcm9tLFxyXG4gICAgICBjaGFuZ2UsXHJcbiAgICAgIHV0eG9pZEFycmF5LFxyXG4gICAgICB0aGlzLmdldFR4RmVlKCksXHJcbiAgICAgIGp1bmVBc3NldElELFxyXG4gICAgICBtZW1vLFxyXG4gICAgICBhc09mLFxyXG4gICAgICBsb2NrdGltZSxcclxuICAgICAgdGhyZXNob2xkXHJcbiAgICApXHJcblxyXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZE5GVFRyYW5zZmVyVHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBJbXBvcnQgVHguIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXHJcbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHV0eG9zZXQgIEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXHJcbiAgICogQHBhcmFtIG93bmVyQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBpbXBvcnRcclxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluaWQgZm9yIHdoZXJlIHRoZSBpbXBvcnQgaXMgY29taW5nIGZyb21cclxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xyXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxyXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xyXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcclxuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbSW1wb3J0VHhdXS5cclxuICAgKlxyXG4gICAqIEByZW1hcmtzXHJcbiAgICogVGhpcyBoZWxwZXIgZXhpc3RzIGJlY2F1c2UgdGhlIGVuZHBvaW50IEFQSSBzaG91bGQgYmUgdGhlIHByaW1hcnkgcG9pbnQgb2YgZW50cnkgZm9yIG1vc3QgZnVuY3Rpb25hbGl0eS5cclxuICAgKi9cclxuICBidWlsZEltcG9ydFR4ID0gYXN5bmMgKFxyXG4gICAgdXR4b3NldDogVVRYT1NldCxcclxuICAgIG93bmVyQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIHNvdXJjZUNoYWluOiBCdWZmZXIgfCBzdHJpbmcsXHJcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxyXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxyXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxXHJcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XHJcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRJbXBvcnRUeFwiXHJcbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheSh0b0FkZHJlc3NlcywgY2FsbGVyKS5tYXAoXHJcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXHJcbiAgICApXHJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxyXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxyXG4gICAgKVxyXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXHJcbiAgICAgIGNhbGxlclxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcblxyXG4gICAgbGV0IHNyY0NoYWluOiBzdHJpbmcgPSB1bmRlZmluZWRcclxuXHJcbiAgICBpZiAodHlwZW9mIHNvdXJjZUNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZEltcG9ydFR4OiBTb3VyY2UgQ2hhaW5JRCBpcyB1bmRlZmluZWQuXCJcclxuICAgICAgKVxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc291cmNlQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgc3JjQ2hhaW4gPSBzb3VyY2VDaGFpblxyXG4gICAgICBzb3VyY2VDaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoc291cmNlQ2hhaW4pXHJcbiAgICB9IGVsc2UgaWYgKCEoc291cmNlQ2hhaW4gaW5zdGFuY2VvZiBCdWZmZXIpKSB7XHJcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZEltcG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgK1xyXG4gICAgICAgICAgdHlwZW9mIHNvdXJjZUNoYWluXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhdG9taWNVVFhPczogVVRYT1NldCA9IChcclxuICAgICAgYXdhaXQgdGhpcy5nZXRVVFhPcyhvd25lckFkZHJlc3Nlcywgc3JjQ2hhaW4sIDAsIHVuZGVmaW5lZClcclxuICAgICkudXR4b3NcclxuICAgIGNvbnN0IGp1bmVBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEpVTkVBc3NldElEKClcclxuICAgIGNvbnN0IGF0b21pY3M6IFVUWE9bXSA9IGF0b21pY1VUWE9zLmdldEFsbFVUWE9zKClcclxuXHJcbiAgICBpZiAoYXRvbWljcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgdGhyb3cgbmV3IE5vQXRvbWljVVRYT3NFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gSlZNQVBJLmJ1aWxkSW1wb3J0VHg6IE5vIGF0b21pYyBVVFhPcyB0byBpbXBvcnQgZnJvbSBcIiArXHJcbiAgICAgICAgICBzcmNDaGFpbiArXHJcbiAgICAgICAgICBcIiB1c2luZyBhZGRyZXNzZXM6IFwiICtcclxuICAgICAgICAgIG93bmVyQWRkcmVzc2VzLmpvaW4oXCIsIFwiKVxyXG4gICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xyXG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkSW1wb3J0VHgoXHJcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcclxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXHJcbiAgICAgIHRvLFxyXG4gICAgICBmcm9tLFxyXG4gICAgICBjaGFuZ2UsXHJcbiAgICAgIGF0b21pY3MsXHJcbiAgICAgIHNvdXJjZUNoYWluLFxyXG4gICAgICB0aGlzLmdldFR4RmVlKCksXHJcbiAgICAgIGp1bmVBc3NldElELFxyXG4gICAgICBtZW1vLFxyXG4gICAgICBhc09mLFxyXG4gICAgICBsb2NrdGltZSxcclxuICAgICAgdGhyZXNob2xkXHJcbiAgICApXHJcblxyXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZEltcG9ydFR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxyXG4gICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0IFR4LiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxyXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXHJcbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGV4cG9ydGVkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gZGVzdGluYXRpb25DaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGFzc2V0cyB3aWxsIGJlIHNlbnQuXHJcbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcclxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3MgcHJvdmlkZWRcclxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcclxuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXHJcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cclxuICAgKiBAcGFyYW0gYXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGFzc2V0IHRvIHNlbmQuIERlZmF1bHRzIHRvIEpVTkUgYXNzZXRJRC5cclxuICAgKiBAcGFyYW0gZmVlVG9FeHBvcnQgT3B0aW9uYWwuIFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgdG8gZGVzdGluYXRpb24gY2hhaW4gdG8gdXNlIGFzIGEgZmVlXHJcbiAgICogUmVnYXJkbGVzcyBvZiB0aGUgYXNzZXQgd2hpY2ggeW91XCJyZSBleHBvcnRpbmcsIGFsbCBmZWVzIGFyZSBwYWlkIGluIEpVTkUuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGFuIFtbRXhwb3J0VHhdXS5cclxuICAgKi9cclxuICBidWlsZEV4cG9ydFR4ID0gYXN5bmMgKFxyXG4gICAgdXR4b3NldDogVVRYT1NldCxcclxuICAgIGFtb3VudDogQk4sXHJcbiAgICBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgfCBzdHJpbmcsXHJcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxyXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxyXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxLFxyXG4gICAgYXNzZXRJRDogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgZmVlVG9FeHBvcnQ6IEJOID0gdW5kZWZpbmVkXHJcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XHJcbiAgICBjb25zdCBwcmVmaXhlczogb2JqZWN0ID0ge31cclxuICAgIHRvQWRkcmVzc2VzLm1hcCgoYTogc3RyaW5nKTogdm9pZCA9PiB7XHJcbiAgICAgIHByZWZpeGVzW2Euc3BsaXQoXCItXCIpWzBdXSA9IHRydWVcclxuICAgIH0pXHJcbiAgICBpZiAoT2JqZWN0LmtleXMocHJlZml4ZXMpLmxlbmd0aCAhPT0gMSkge1xyXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBKVk1BUEkuYnVpbGRFeHBvcnRUeDogVG8gYWRkcmVzc2VzIG11c3QgaGF2ZSB0aGUgc2FtZSBjaGFpbklEIHByZWZpeC5cIlxyXG4gICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIlxyXG4gICAgICApXHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKGRlc3RpbmF0aW9uQ2hhaW4pIC8vXHJcbiAgICB9IGVsc2UgaWYgKCEoZGVzdGluYXRpb25DaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcclxuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gSlZNQVBJLmJ1aWxkRXhwb3J0VHg6IEludmFsaWQgZGVzdGluYXRpb25DaGFpbiB0eXBlOiBcIiArXHJcbiAgICAgICAgICB0eXBlb2YgZGVzdGluYXRpb25DaGFpblxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICBpZiAoZGVzdGluYXRpb25DaGFpbi5sZW5ndGggIT09IDMyKSB7XHJcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIG11c3QgYmUgMzIgYnl0ZXMgaW4gbGVuZ3RoLlwiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSBbXVxyXG4gICAgdG9BZGRyZXNzZXMubWFwKChhOiBzdHJpbmcpOiB2b2lkID0+IHtcclxuICAgICAgdG8ucHVzaChiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZEV4cG9ydFR4XCJcclxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXHJcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXHJcbiAgICApXHJcblxyXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXHJcbiAgICAgIGNhbGxlclxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcblxyXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xyXG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBqdW5lQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRKVU5FQXNzZXRJRCgpXHJcbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgYXNzZXRJRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoanVuZUFzc2V0SUQpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcclxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcclxuICAgIGNvbnN0IGFzc2V0SURCdWY6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYXNzZXRJRClcclxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcclxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRFeHBvcnRUeChcclxuICAgICAgbmV0d29ya0lELFxyXG4gICAgICBibG9ja2NoYWluSUQsXHJcbiAgICAgIGFtb3VudCxcclxuICAgICAgYXNzZXRJREJ1ZixcclxuICAgICAgdG8sXHJcbiAgICAgIGZyb20sXHJcbiAgICAgIGNoYW5nZSxcclxuICAgICAgZGVzdGluYXRpb25DaGFpbixcclxuICAgICAgZmVlLFxyXG4gICAgICBqdW5lQXNzZXRJRCxcclxuICAgICAgbWVtbyxcclxuICAgICAgYXNPZixcclxuICAgICAgbG9ja3RpbWUsXHJcbiAgICAgIHRocmVzaG9sZCxcclxuICAgICAgZmVlVG9FeHBvcnRcclxuICAgIClcclxuXHJcbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gSlZNQVBJLmJ1aWxkRXhwb3J0VHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxyXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXHJcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXHJcbiAgICogQHBhcmFtIGluaXRpYWxTdGF0ZSBUaGUgW1tJbml0aWFsU3RhdGVzXV0gdGhhdCByZXByZXNlbnQgdGhlIGludGlhbCBzdGF0ZSBvZiBhIGNyZWF0ZWQgYXNzZXRcclxuICAgKiBAcGFyYW0gbmFtZSBTdHJpbmcgZm9yIHRoZSBkZXNjcmlwdGl2ZSBuYW1lIG9mIHRoZSBhc3NldFxyXG4gICAqIEBwYXJhbSBzeW1ib2wgU3RyaW5nIGZvciB0aGUgdGlja2VyIHN5bWJvbCBvZiB0aGUgYXNzZXRcclxuICAgKiBAcGFyYW0gZGVub21pbmF0aW9uIE51bWJlciBmb3IgdGhlIGRlbm9taW5hdGlvbiB3aGljaCBpcyAxMF5ELiBEIG11c3QgYmUgPj0gMCBhbmQgPD0gMzIuIEV4OiAkMSBKVU5FID0gMTBeOSAkbkpVTkVcclxuICAgKiBAcGFyYW0gbWludE91dHB1dHMgT3B0aW9uYWwuIEFycmF5IG9mIFtbU0VDUE1pbnRPdXRwdXRdXXMgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIHRyYW5zYWN0aW9uLiBUaGVzZSBvdXRwdXRzIGNhbiBiZSBzcGVudCB0byBtaW50IG1vcmUgdG9rZW5zLlxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xyXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tDcmVhdGVBc3NldFR4XV0uXHJcbiAgICpcclxuICAgKi9cclxuICBidWlsZENyZWF0ZUFzc2V0VHggPSBhc3luYyAoXHJcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxyXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxyXG4gICAgaW5pdGlhbFN0YXRlczogSW5pdGlhbFN0YXRlcyxcclxuICAgIG5hbWU6IHN0cmluZyxcclxuICAgIHN5bWJvbDogc3RyaW5nLFxyXG4gICAgZGVub21pbmF0aW9uOiBudW1iZXIsXHJcbiAgICBtaW50T3V0cHV0czogU0VDUE1pbnRPdXRwdXRbXSA9IHVuZGVmaW5lZCxcclxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcclxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcclxuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZENyZWF0ZUFzc2V0VHhcIlxyXG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcclxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcclxuICAgIClcclxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcclxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxyXG4gICAgICBjYWxsZXJcclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxyXG5cclxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcclxuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHN5bWJvbC5sZW5ndGggPiBKVk1Db25zdGFudHMuU1lNQk9MTUFYTEVOKSB7XHJcbiAgICAgIHRocm93IG5ldyBTeW1ib2xFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gSlZNQVBJLmJ1aWxkQ3JlYXRlQXNzZXRUeDogU3ltYm9scyBtYXkgbm90IGV4Y2VlZCBsZW5ndGggb2YgXCIgK1xyXG4gICAgICAgICAgSlZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICBpZiAobmFtZS5sZW5ndGggPiBKVk1Db25zdGFudHMuQVNTRVROQU1FTEVOKSB7XHJcbiAgICAgIHRocm93IG5ldyBOYW1lRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZENyZWF0ZUFzc2V0VHg6IE5hbWVzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArXHJcbiAgICAgICAgICBKVk1Db25zdGFudHMuQVNTRVROQU1FTEVOXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxyXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxyXG4gICAgY29uc3QganVuZUFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0SlVORUFzc2V0SUQoKVxyXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0RGVmYXVsdENyZWF0aW9uVHhGZWUoKVxyXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZENyZWF0ZUFzc2V0VHgoXHJcbiAgICAgIG5ldHdvcmtJRCxcclxuICAgICAgYmxvY2tjaGFpbklELFxyXG4gICAgICBmcm9tLFxyXG4gICAgICBjaGFuZ2UsXHJcbiAgICAgIGluaXRpYWxTdGF0ZXMsXHJcbiAgICAgIG5hbWUsXHJcbiAgICAgIHN5bWJvbCxcclxuICAgICAgZGVub21pbmF0aW9uLFxyXG4gICAgICBtaW50T3V0cHV0cyxcclxuICAgICAgZmVlLFxyXG4gICAgICBqdW5lQXNzZXRJRCxcclxuICAgICAgbWVtbyxcclxuICAgICAgYXNPZlxyXG4gICAgKVxyXG5cclxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgsIGZlZSkpKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZENyZWF0ZUFzc2V0VHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XHJcbiAgfVxyXG5cclxuICBidWlsZFNFQ1BNaW50VHggPSBhc3luYyAoXHJcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxyXG4gICAgbWludE93bmVyOiBTRUNQTWludE91dHB1dCxcclxuICAgIHRyYW5zZmVyT3duZXI6IFNFQ1BUcmFuc2Zlck91dHB1dCxcclxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxyXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIG1pbnRVVFhPSUQ6IHN0cmluZyxcclxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcclxuICApOiBQcm9taXNlPGFueT4gPT4ge1xyXG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkU0VDUE1pbnRUeFwiXHJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxyXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxyXG4gICAgKVxyXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXHJcbiAgICAgIGNhbGxlclxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcblxyXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xyXG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxyXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxyXG4gICAgY29uc3QganVuZUFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0SlVORUFzc2V0SUQoKVxyXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0TWludFR4RmVlKClcclxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRTRUNQTWludFR4KFxyXG4gICAgICBuZXR3b3JrSUQsXHJcbiAgICAgIGJsb2NrY2hhaW5JRCxcclxuICAgICAgbWludE93bmVyLFxyXG4gICAgICB0cmFuc2Zlck93bmVyLFxyXG4gICAgICBmcm9tLFxyXG4gICAgICBjaGFuZ2UsXHJcbiAgICAgIG1pbnRVVFhPSUQsXHJcbiAgICAgIGZlZSxcclxuICAgICAganVuZUFzc2V0SUQsXHJcbiAgICAgIG1lbW8sXHJcbiAgICAgIGFzT2ZcclxuICAgIClcclxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBKVk1BUEkuYnVpbGRTRUNQTWludFR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxyXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXHJcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXHJcbiAgICogQHBhcmFtIG1pbnRlclNldHMgaXMgYSBsaXN0IHdoZXJlIGVhY2ggZWxlbWVudCBzcGVjaWZpZXMgdGhhdCB0aHJlc2hvbGQgb2YgdGhlIGFkZHJlc3NlcyBpbiBtaW50ZXJzIG1heSB0b2dldGhlciBtaW50IG1vcmUgb2YgdGhlIGFzc2V0IGJ5IHNpZ25pbmcgYSBtaW50aW5nIHRyYW5zYWN0aW9uXHJcbiAgICogQHBhcmFtIG5hbWUgU3RyaW5nIGZvciB0aGUgZGVzY3JpcHRpdmUgbmFtZSBvZiB0aGUgYXNzZXRcclxuICAgKiBAcGFyYW0gc3ltYm9sIFN0cmluZyBmb3IgdGhlIHRpY2tlciBzeW1ib2wgb2YgdGhlIGFzc2V0XHJcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXHJcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgbWludCBvdXRwdXRcclxuICAgKlxyXG4gICAqIGBgYGpzXHJcbiAgICogRXhhbXBsZSBtaW50ZXJTZXRzOlxyXG4gICAqIFtcclxuICAgKiAgICAgIHtcclxuICAgKiAgICAgICAgICBcIm1pbnRlcnNcIjpbXHJcbiAgICogICAgICAgICAgICAgIFwiWC1qdW5lMWdoc3RqdWtydHc4OTM1bHJ5cXRuaDY0M3hlOWE5NHUzdGM3NWM3XCJcclxuICAgKiAgICAgICAgICBdLFxyXG4gICAqICAgICAgICAgIFwidGhyZXNob2xkXCI6IDFcclxuICAgKiAgICAgIH0sXHJcbiAgICogICAgICB7XHJcbiAgICogICAgICAgICAgXCJtaW50ZXJzXCI6IFtcclxuICAgKiAgICAgICAgICAgICAgXCJYLWp1bmUxeWVsbDNlNG5sbjBtMzljZnBkaGdxcHJzZDg3amtoNHFuYWtrbHhcIixcclxuICAgKiAgICAgICAgICAgICAgXCJYLWp1bmUxazRucjI2YzgwamFxdXptOTM2OWo1YTRzaG13Y2puMHZtZW1janpcIixcclxuICAgKiAgICAgICAgICAgICAgXCJYLWp1bmUxenRrenNyam5rbjBjZWs1cnl2aHFzd2R0Y2cyM25oZ2Uzbm5yNWVcIlxyXG4gICAqICAgICAgICAgIF0sXHJcbiAgICogICAgICAgICAgXCJ0aHJlc2hvbGRcIjogMlxyXG4gICAqICAgICAgfVxyXG4gICAqIF1cclxuICAgKiBgYGBcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW0NyZWF0ZUFzc2V0VHhdXS5cclxuICAgKlxyXG4gICAqL1xyXG4gIGJ1aWxkQ3JlYXRlTkZUQXNzZXRUeCA9IGFzeW5jIChcclxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXHJcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBtaW50ZXJTZXRzOiBNaW50ZXJTZXRbXSxcclxuICAgIG5hbWU6IHN0cmluZyxcclxuICAgIHN5bWJvbDogc3RyaW5nLFxyXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcclxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKVxyXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xyXG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkQ3JlYXRlTkZUQXNzZXRUeFwiXHJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxyXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxyXG4gICAgKVxyXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXHJcbiAgICAgIGNhbGxlclxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcblxyXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xyXG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcclxuICAgIH1cclxuXHJcbiAgICBpZiAobmFtZS5sZW5ndGggPiBKVk1Db25zdGFudHMuQVNTRVROQU1FTEVOKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBOYW1lRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZENyZWF0ZU5GVEFzc2V0VHg6IE5hbWVzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArXHJcbiAgICAgICAgICBKVk1Db25zdGFudHMuQVNTRVROQU1FTEVOXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIGlmIChzeW1ib2wubGVuZ3RoID4gSlZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTikge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgU3ltYm9sRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZENyZWF0ZU5GVEFzc2V0VHg6IFN5bWJvbHMgbWF5IG5vdCBleGNlZWQgbGVuZ3RoIG9mIFwiICtcclxuICAgICAgICAgIEpWTUNvbnN0YW50cy5TWU1CT0xNQVhMRU5cclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcclxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcclxuICAgIGNvbnN0IGNyZWF0aW9uVHhGZWU6IEJOID0gdGhpcy5nZXRDcmVhdGlvblR4RmVlKClcclxuICAgIGNvbnN0IGp1bmVBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEpVTkVBc3NldElEKClcclxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVORlRBc3NldFR4KFxyXG4gICAgICBuZXR3b3JrSUQsXHJcbiAgICAgIGJsb2NrY2hhaW5JRCxcclxuICAgICAgZnJvbSxcclxuICAgICAgY2hhbmdlLFxyXG4gICAgICBtaW50ZXJTZXRzLFxyXG4gICAgICBuYW1lLFxyXG4gICAgICBzeW1ib2wsXHJcbiAgICAgIGNyZWF0aW9uVHhGZWUsXHJcbiAgICAgIGp1bmVBc3NldElELFxyXG4gICAgICBtZW1vLFxyXG4gICAgICBhc09mLFxyXG4gICAgICBsb2NrdGltZVxyXG4gICAgKVxyXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgY3JlYXRpb25UeEZlZSkpKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEpWTUFQSS5idWlsZENyZWF0ZU5GVEFzc2V0VHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXHJcbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHV0eG9zZXQgIEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXHJcbiAgICogQHBhcmFtIG93bmVycyBFaXRoZXIgYSBzaW5nbGUgb3IgYW4gYXJyYXkgb2YgW1tPdXRwdXRPd25lcnNdXSB0byBzZW5kIHRoZSBuZnQgb3V0cHV0XHJcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIE5GVCBmcm9tIHRoZSB1dHhvSUQgcHJvdmlkZWRcclxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcclxuICAgKiBAcGFyYW0gdXR4b2lkIEEgYmFzZTU4IHV0eG9JRCBvciBhbiBhcnJheSBvZiBiYXNlNTggdXR4b0lEcyBmb3IgdGhlIG5mdCBtaW50IG91dHB1dCB0aGlzIHRyYW5zYWN0aW9uIGlzIHNlbmRpbmdcclxuICAgKiBAcGFyYW0gZ3JvdXBJRCBPcHRpb25hbC4gVGhlIGdyb3VwIHRoaXMgTkZUIGlzIGlzc3VlZCB0by5cclxuICAgKiBAcGFyYW0gcGF5bG9hZCBPcHRpb25hbC4gRGF0YSBmb3IgTkZUIFBheWxvYWQgYXMgZWl0aGVyIGEgW1tQYXlsb2FkQmFzZV1dIG9yIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcclxuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhbiBbW09wZXJhdGlvblR4XV0uXHJcbiAgICpcclxuICAgKi9cclxuICBidWlsZENyZWF0ZU5GVE1pbnRUeCA9IGFzeW5jIChcclxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXHJcbiAgICBvd25lcnM6IE91dHB1dE93bmVyc1tdIHwgT3V0cHV0T3duZXJzLFxyXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxyXG4gICAgdXR4b2lkOiBzdHJpbmcgfCBzdHJpbmdbXSxcclxuICAgIGdyb3VwSUQ6IG51bWJlciA9IDAsXHJcbiAgICBwYXlsb2FkOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcclxuICApOiBQcm9taXNlPGFueT4gPT4ge1xyXG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkQ3JlYXRlTkZUTWludFR4XCJcclxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXHJcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXHJcbiAgICApXHJcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcclxuICAgICAgY2FsbGVyXHJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcclxuXHJcbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XHJcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChwYXlsb2FkIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcclxuICAgICAgcGF5bG9hZCA9IHBheWxvYWQuZ2V0UGF5bG9hZCgpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiB1dHhvaWQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgdXR4b2lkID0gW3V0eG9pZF1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBqdW5lQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRKVU5FQXNzZXRJRCgpXHJcblxyXG4gICAgaWYgKG93bmVycyBpbnN0YW5jZW9mIE91dHB1dE93bmVycykge1xyXG4gICAgICBvd25lcnMgPSBbb3duZXJzXVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXHJcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXHJcbiAgICBjb25zdCB0eEZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcclxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVORlRNaW50VHgoXHJcbiAgICAgIG5ldHdvcmtJRCxcclxuICAgICAgYmxvY2tjaGFpbklELFxyXG4gICAgICBvd25lcnMsXHJcbiAgICAgIGZyb20sXHJcbiAgICAgIGNoYW5nZSxcclxuICAgICAgdXR4b2lkLFxyXG4gICAgICBncm91cElELFxyXG4gICAgICBwYXlsb2FkLFxyXG4gICAgICB0eEZlZSxcclxuICAgICAganVuZUFzc2V0SUQsXHJcbiAgICAgIG1lbW8sXHJcbiAgICAgIGFzT2ZcclxuICAgIClcclxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBKVk1BUEkuYnVpbGRDcmVhdGVORlRNaW50VHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCB0YWtlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBhbmQgc2lnbnMgaXQsIHJldHVybmluZyB0aGUgcmVzdWx0aW5nIFtbVHhdXS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHggVGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIG9mIHR5cGUgW1tVbnNpZ25lZFR4XV1cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgc2lnbmVkIHRyYW5zYWN0aW9uIG9mIHR5cGUgW1tUeF1dXHJcbiAgICovXHJcbiAgc2lnblR4ID0gKHV0eDogVW5zaWduZWRUeCk6IFR4ID0+IHV0eC5zaWduKHRoaXMua2V5Y2hhaW4pXHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBub2RlJ3MgaXNzdWVUeCBtZXRob2QgZnJvbSB0aGUgQVBJIGFuZCByZXR1cm5zIHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gSUQgYXMgYSBzdHJpbmcuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdHggQSBzdHJpbmcsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LCBvciBbW1R4XV0gcmVwcmVzZW50aW5nIGEgdHJhbnNhY3Rpb25cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbiBJRCBvZiB0aGUgcG9zdGVkIHRyYW5zYWN0aW9uLlxyXG4gICAqL1xyXG4gIGlzc3VlVHggPSBhc3luYyAodHg6IHN0cmluZyB8IEJ1ZmZlciB8IFR4KTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGxldCBUcmFuc2FjdGlvbiA9IFwiXCJcclxuICAgIGlmICh0eXBlb2YgdHggPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgVHJhbnNhY3Rpb24gPSB0eFxyXG4gICAgfSBlbHNlIGlmICh0eCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xyXG4gICAgICBjb25zdCB0eG9iajogVHggPSBuZXcgVHgoKVxyXG4gICAgICB0eG9iai5mcm9tQnVmZmVyKHR4KVxyXG4gICAgICBUcmFuc2FjdGlvbiA9IHR4b2JqLnRvU3RyaW5nSGV4KClcclxuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBUeCkge1xyXG4gICAgICBUcmFuc2FjdGlvbiA9IHR4LnRvU3RyaW5nSGV4KClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBUcmFuc2FjdGlvbkVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBKVk1BUEkuaXNzdWVUeDogcHJvdmlkZWQgdHggaXMgbm90IGV4cGVjdGVkIHR5cGUgb2Ygc3RyaW5nLCBCdWZmZXIsIG9yIFR4XCJcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgY29uc3QgcGFyYW1zOiBJc3N1ZVR4UGFyYW1zID0ge1xyXG4gICAgICB0eDogVHJhbnNhY3Rpb24udG9TdHJpbmcoKSxcclxuICAgICAgZW5jb2Rpbmc6IFwiaGV4XCJcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp2bS5pc3N1ZVR4XCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBub2RlJ3MgZ2V0QWRkcmVzc1R4cyBtZXRob2QgZnJvbSB0aGUgQVBJIGFuZCByZXR1cm5zIHRyYW5zYWN0aW9ucyBjb3JyZXNwb25kaW5nIHRvIHRoZSBwcm92aWRlZCBhZGRyZXNzIGFuZCBhc3NldElEXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyBmb3Igd2hpY2ggd2UncmUgZmV0Y2hpbmcgcmVsYXRlZCB0cmFuc2FjdGlvbnMuXHJcbiAgICogQHBhcmFtIGN1cnNvciBQYWdlIG51bWJlciBvciBvZmZzZXQuXHJcbiAgICogQHBhcmFtIHBhZ2VTaXplICBOdW1iZXIgb2YgaXRlbXMgdG8gcmV0dXJuIHBlciBwYWdlLiBPcHRpb25hbC4gRGVmYXVsdHMgdG8gMTAyNC4gSWYgW3BhZ2VTaXplXSA9PSAwIG9yIFtwYWdlU2l6ZV0gPiBbbWF4UGFnZVNpemVdLCB0aGVuIGl0IGZldGNoZXMgYXQgbWF4IFttYXhQYWdlU2l6ZV0gdHJhbnNhY3Rpb25zXHJcbiAgICogQHBhcmFtIGFzc2V0SUQgT25seSByZXR1cm4gdHJhbnNhY3Rpb25zIHRoYXQgY2hhbmdlZCB0aGUgYmFsYW5jZSBvZiB0aGlzIGFzc2V0LiBNdXN0IGJlIGFuIElEIG9yIGFuIGFsaWFzIGZvciBhbiBhc3NldC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBhcnJheSBvZiB0cmFuc2FjdGlvbiBJRHMgYW5kIHBhZ2Ugb2Zmc2V0XHJcbiAgICovXHJcbiAgZ2V0QWRkcmVzc1R4cyA9IGFzeW5jIChcclxuICAgIGFkZHJlc3M6IHN0cmluZyxcclxuICAgIGN1cnNvcjogbnVtYmVyLFxyXG4gICAgcGFnZVNpemU6IG51bWJlciB8IHVuZGVmaW5lZCxcclxuICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlclxyXG4gICk6IFByb21pc2U8R2V0QWRkcmVzc1R4c1Jlc3BvbnNlPiA9PiB7XHJcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xyXG4gICAgbGV0IHBhZ2VTaXplTnVtOiBudW1iZXJcclxuXHJcbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhc3NldCA9IGFzc2V0SURcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIHBhZ2VTaXplICE9PSBcIm51bWJlclwiKSB7XHJcbiAgICAgIHBhZ2VTaXplTnVtID0gMFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcGFnZVNpemVOdW0gPSBwYWdlU2l6ZVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhcmFtczogR2V0QWRkcmVzc1R4c1BhcmFtcyA9IHtcclxuICAgICAgYWRkcmVzcyxcclxuICAgICAgY3Vyc29yLFxyXG4gICAgICBwYWdlU2l6ZTogcGFnZVNpemVOdW0sXHJcbiAgICAgIGFzc2V0SUQ6IGFzc2V0XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwianZtLmdldEFkZHJlc3NUeHNcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlbmRzIGFuIGFtb3VudCBvZiBhc3NldElEIHRvIHRoZSBzcGVjaWZpZWQgYWRkcmVzcyBmcm9tIGEgbGlzdCBvZiBvd25lZCBvZiBhZGRyZXNzZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgdGhhdCBvd25zIHRoZSBwcml2YXRlIGtleXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBgZnJvbWAgYWRkcmVzc2VzXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB1bmxvY2tpbmcgdGhlIHVzZXJcclxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXRJRCBvZiB0aGUgYXNzZXQgdG8gc2VuZFxyXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBvZiB0aGUgYXNzZXQgdG8gYmUgc2VudFxyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvZiB0aGUgcmVjaXBpZW50XHJcbiAgICogQHBhcmFtIGZyb20gT3B0aW9uYWwuIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBtYW5hZ2VkIGJ5IHRoZSBub2RlJ3Mga2V5c3RvcmUgZm9yIHRoaXMgYmxvY2tjaGFpbiB3aGljaCB3aWxsIGZ1bmQgdGhpcyB0cmFuc2FjdGlvblxyXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyIE9wdGlvbmFsLiBBbiBhZGRyZXNzIHRvIHNlbmQgdGhlIGNoYW5nZVxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsLiBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIHRoZSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbidzIElELlxyXG4gICAqL1xyXG4gIHNlbmQgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlcixcclxuICAgIGFtb3VudDogbnVtYmVyIHwgQk4sXHJcbiAgICB0bzogc3RyaW5nLFxyXG4gICAgZnJvbTogc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcclxuICAgIGNoYW5nZUFkZHI6IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuICAgIG1lbW86IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZFxyXG4gICk6IFByb21pc2U8U2VuZFJlc3BvbnNlPiA9PiB7XHJcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xyXG4gICAgbGV0IGFtbnQ6IEJOXHJcblxyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyh0bykgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcIkVycm9yIC0gSlZNQVBJLnNlbmQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIilcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhc3NldCA9IGFzc2V0SURcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgYW1vdW50ID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgIGFtbnQgPSBuZXcgQk4oYW1vdW50KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYW1udCA9IGFtb3VudFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhcmFtczogU2VuZFBhcmFtcyA9IHtcclxuICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgIGFzc2V0SUQ6IGFzc2V0LFxyXG4gICAgICBhbW91bnQ6IGFtbnQudG9TdHJpbmcoMTApLFxyXG4gICAgICB0bzogdG9cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwic2VuZFwiXHJcbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgY2FsbGVyKVxyXG4gICAgaWYgKHR5cGVvZiBmcm9tICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHBhcmFtc1tcImZyb21cIl0gPSBmcm9tXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoY2hhbmdlQWRkcikgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEpWTUFQSS5zZW5kOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpXHJcbiAgICAgIH1cclxuICAgICAgcGFyYW1zW1wiY2hhbmdlQWRkclwiXSA9IGNoYW5nZUFkZHJcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIG1lbW8gIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgaWYgKHR5cGVvZiBtZW1vICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgcGFyYW1zW1wibWVtb1wiXSA9IGJpbnRvb2xzLmNiNThFbmNvZGUobWVtbylcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwYXJhbXNbXCJtZW1vXCJdID0gbWVtb1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJqdm0uc2VuZFwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VuZHMgYW4gYW1vdW50IG9mIGFzc2V0SUQgdG8gYW4gYXJyYXkgb2Ygc3BlY2lmaWVkIGFkZHJlc3NlcyBmcm9tIGEgbGlzdCBvZiBvd25lZCBvZiBhZGRyZXNzZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgdGhhdCBvd25zIHRoZSBwcml2YXRlIGtleXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBgZnJvbWAgYWRkcmVzc2VzXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB1bmxvY2tpbmcgdGhlIHVzZXJcclxuICAgKiBAcGFyYW0gc2VuZE91dHB1dHMgVGhlIGFycmF5IG9mIFNlbmRPdXRwdXRzLiBBIFNlbmRPdXRwdXQgaXMgYW4gb2JqZWN0IGxpdGVyYWwgd2hpY2ggY29udGFpbnMgYW4gYXNzZXRJRCwgYW1vdW50LCBhbmQgdG8uXHJcbiAgICogQHBhcmFtIGZyb20gT3B0aW9uYWwuIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBtYW5hZ2VkIGJ5IHRoZSBub2RlJ3Mga2V5c3RvcmUgZm9yIHRoaXMgYmxvY2tjaGFpbiB3aGljaCB3aWxsIGZ1bmQgdGhpcyB0cmFuc2FjdGlvblxyXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyIE9wdGlvbmFsLiBBbiBhZGRyZXNzIHRvIHNlbmQgdGhlIGNoYW5nZVxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsLiBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIHRoZSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvblwicyBJRC5cclxuICAgKi9cclxuICBzZW5kTXVsdGlwbGUgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIHNlbmRPdXRwdXRzOiB7XHJcbiAgICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlclxyXG4gICAgICBhbW91bnQ6IG51bWJlciB8IEJOXHJcbiAgICAgIHRvOiBzdHJpbmdcclxuICAgIH1bXSxcclxuICAgIGZyb206IHN0cmluZ1tdIHwgQnVmZmVyW10gPSB1bmRlZmluZWQsXHJcbiAgICBjaGFuZ2VBZGRyOiBzdHJpbmcgPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWRcclxuICApOiBQcm9taXNlPFNlbmRNdWx0aXBsZVJlc3BvbnNlPiA9PiB7XHJcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xyXG4gICAgbGV0IGFtbnQ6IEJOXHJcbiAgICBjb25zdCBzT3V0cHV0czogU091dHB1dHNQYXJhbXNbXSA9IFtdXHJcblxyXG4gICAgc2VuZE91dHB1dHMuZm9yRWFjaChcclxuICAgICAgKG91dHB1dDoge1xyXG4gICAgICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlclxyXG4gICAgICAgIGFtb3VudDogbnVtYmVyIHwgQk5cclxuICAgICAgICB0bzogc3RyaW5nXHJcbiAgICAgIH0pID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKG91dHB1dC50bykgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxyXG4gICAgICAgICAgICBcIkVycm9yIC0gSlZNQVBJLnNlbmRNdWx0aXBsZTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3V0cHV0LmFzc2V0SUQgIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShvdXRwdXQuYXNzZXRJRClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYXNzZXQgPSBvdXRwdXQuYXNzZXRJRFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG91dHB1dC5hbW91bnQgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgIGFtbnQgPSBuZXcgQk4ob3V0cHV0LmFtb3VudClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYW1udCA9IG91dHB1dC5hbW91bnRcclxuICAgICAgICB9XHJcbiAgICAgICAgc091dHB1dHMucHVzaCh7XHJcbiAgICAgICAgICB0bzogb3V0cHV0LnRvLFxyXG4gICAgICAgICAgYXNzZXRJRDogYXNzZXQsXHJcbiAgICAgICAgICBhbW91bnQ6IGFtbnQudG9TdHJpbmcoMTApXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG4gICAgKVxyXG5cclxuICAgIGNvbnN0IHBhcmFtczogU2VuZE11bHRpcGxlUGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcclxuICAgICAgb3V0cHV0czogc091dHB1dHNcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwic2VuZFwiXHJcbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgY2FsbGVyKVxyXG4gICAgaWYgKHR5cGVvZiBmcm9tICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHBhcmFtcy5mcm9tID0gZnJvbVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkciAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGNoYW5nZUFkZHIpID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBKVk1BUEkuc2VuZDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxyXG4gICAgICB9XHJcbiAgICAgIHBhcmFtcy5jaGFuZ2VBZGRyID0gY2hhbmdlQWRkclxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgbWVtbyAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBpZiAodHlwZW9mIG1lbW8gIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICBwYXJhbXMubWVtbyA9IGJpbnRvb2xzLmNiNThFbmNvZGUobWVtbylcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwYXJhbXMubWVtbyA9IG1lbW9cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwianZtLnNlbmRNdWx0aXBsZVwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgVmlydHVhbCBNYWNoaW5l4oCZcyBnZW5lc2lzIHN0YXRlLCBjcmVhdGUgdGhlIGJ5dGUgcmVwcmVzZW50YXRpb24gb2YgdGhhdCBzdGF0ZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBnZW5lc2lzRGF0YSBUaGUgYmxvY2tjaGFpbidzIGdlbmVzaXMgZGF0YSBvYmplY3RcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2Ugb2YgYSBzdHJpbmcgb2YgYnl0ZXNcclxuICAgKi9cclxuICBidWlsZEdlbmVzaXMgPSBhc3luYyAoZ2VuZXNpc0RhdGE6IG9iamVjdCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEJ1aWxkR2VuZXNpc1BhcmFtcyA9IHtcclxuICAgICAgZ2VuZXNpc0RhdGFcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcImp2bS5idWlsZEdlbmVzaXNcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYnl0ZXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBpZ25vcmVcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSB8IEJ1ZmZlcltdLFxyXG4gICAgY2FsbGVyOiBzdHJpbmdcclxuICApOiBzdHJpbmdbXSB7XHJcbiAgICBjb25zdCBhZGRyczogc3RyaW5nW10gPSBbXVxyXG4gICAgY29uc3QgY2hhaW5JRDogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxyXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcclxuICAgICAgOiB0aGlzLmdldEJsb2NrY2hhaW5JRCgpXHJcbiAgICBpZiAoYWRkcmVzc2VzICYmIGFkZHJlc3Nlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAodHlwZW9mIGFkZHJlc3Nlc1tgJHtpfWBdID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzZXNbYCR7aX1gXSBhcyBzdHJpbmcpID09PVxyXG4gICAgICAgICAgICBcInVuZGVmaW5lZFwiXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcclxuICAgICAgICAgICAgICBcIkVycm9yIC0gSlZNQVBJLiR7Y2FsbGVyfTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGFkZHJzLnB1c2goYWRkcmVzc2VzW2Ake2l9YF0gYXMgc3RyaW5nKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCB0eXBlOiBTZXJpYWxpemVkVHlwZSA9IFwiYmVjaDMyXCJcclxuICAgICAgICAgIGFkZHJzLnB1c2goXHJcbiAgICAgICAgICAgIHNlcmlhbGl6YXRpb24uYnVmZmVyVG9UeXBlKFxyXG4gICAgICAgICAgICAgIGFkZHJlc3Nlc1tgJHtpfWBdIGFzIEJ1ZmZlcixcclxuICAgICAgICAgICAgICB0eXBlLFxyXG4gICAgICAgICAgICAgIHRoaXMuY29yZS5nZXRIUlAoKSxcclxuICAgICAgICAgICAgICBjaGFpbklEXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBhZGRyc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS4gSW5zdGVhZCB1c2UgdGhlIFtbSnVuZW8uYWRkQVBgJHtJfWBdXSBtZXRob2QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgSnVuZW8gY2xhc3NcclxuICAgKiBAcGFyYW0gYmFzZVVSTCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9iYy9YXCIgYXMgdGhlIHBhdGggdG8gYmxvY2tjaGFpbidzIGJhc2VVUkxcclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSBCbG9ja2NoYWluXCJzIElELiBEZWZhdWx0cyB0byBhbiBlbXB0eSBzdHJpbmc6IFwiXCJcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGNvcmU6IEp1bmVvQ29yZSxcclxuICAgIGJhc2VVUkw6IHN0cmluZyA9IFwiL2V4dC9iYy9YXCIsXHJcbiAgICBibG9ja2NoYWluSUQ6IHN0cmluZyA9IFwiXCJcclxuICApIHtcclxuICAgIHN1cGVyKGNvcmUsIGJhc2VVUkwpXHJcbiAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJsb2NrY2hhaW5JRFxyXG4gICAgY29uc3QgbmV0SUQ6IG51bWJlciA9IGNvcmUuZ2V0TmV0d29ya0lEKClcclxuICAgIGlmIChcclxuICAgICAgbmV0SUQgaW4gRGVmYXVsdHMubmV0d29yayAmJlxyXG4gICAgICBibG9ja2NoYWluSUQgaW4gRGVmYXVsdHMubmV0d29ya1tgJHtuZXRJRH1gXVxyXG4gICAgKSB7XHJcbiAgICAgIGNvbnN0IGFsaWFzOiBzdHJpbmcgPVxyXG4gICAgICAgIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0SUR9YF1bYCR7YmxvY2tjaGFpbklEfWBdW1wiYWxpYXNcIl1cclxuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGFsaWFzKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGJsb2NrY2hhaW5JRClcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19